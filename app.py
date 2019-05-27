import tweepy
import socketio
from flask import Flask, render_template, session, redirect, url_for, request, jsonify
from config import *
from filter_listener import FilterListener
from threading import Thread
from time import sleep, time
from datetime import datetime

app = Flask(__name__)
app.secret_key = SERVER_KEY
socket = socketio.Server(async_mode='threading')
app.wsgi_app = socketio.Middleware(socket, app.wsgi_app)

auth = None
stream = None
message_queue = {
    'sent': 0,
    'received': 0
}
# The maximum number of tweets not received by the client
# before the server stops the stream
MAX_TWEETS_DROPPED = 10


@app.route('/')
def index():
    print(session.get('username'))
    return render_template('index.html')


@app.route('/login', methods=['POST'])
def login():
    username = request.headers.get('username')
    access_token = request.headers.get('access_token')
    access_token_secret = request.headers.get('access_token_secret')

    if not username or not access_token or not access_token_secret:
        return jsonify({'error': 'Missing or invalid headers'})

    if session.get('username') is None:
        session['username'] = username
        session['access_token'] = access_token
        session['access_token_secret'] = access_token_secret
        init_auth()

    return jsonify({'status': 200})


@app.route('/logout')
def logout():
    global stream, auth
    if session.get('username') is not None:
        session.pop('username')
        session.pop('access_token')
        session.pop('access_token_secret')
        stream = None
        auth = None
    return redirect(url_for('index'))


@app.route('/clear_session')
def clear_session():
    print('clearing session...')
    global stream, auth
    if session.get('username') is not None:
        session.pop('username')
        session.pop('access_token')
        session.pop('access_token_secret')
        stream = None
        auth = None

    return jsonify({'status': 200})


@app.route('/status')
def get_stream_status():
    return jsonify({'running': stream is not None and stream.running})


@socket.on('start stream')
def start(data, params):
    print('Starting...')
    print(f'data: {data}, param: {params}')
    if stream is None or stream.running:
        print('Stream uninitialized or already running')
        return
    try:
        thread = Thread(target=start_stream, args=(params['keywords'],))
        thread.start()
    except Exception as e:
        print(e)


@socket.on('stop stream')
def stop(data):
    print('Stopping...')
    if stream is None or not stream.running:
        print('Stream uninitialized or already stopped')
        return
    stream.disconnect()


def client_response_callback():
    message_queue['received'] += 1


def on_stream_connected():
    socket.emit('stream connected')


def on_status(status):
    screen_name = status.user.screen_name
    status_id = status.id_str
    tweet = {
        # Twitter returns dates as "Sat May 04 17:17:10 +0000 2019" so this
        # formats it as 'Sat May 04, 2019 - 10:07 PM
        'created_at': utc_to_local(status.created_at).strftime('%a %b %d, %Y - %I:%M %p'),
        'id': status.id_str,
        'text': status.text,
        'screen_name': screen_name,
        'tweet_url': f'https://twitter.com/{screen_name}/status/{status_id}',
        'profile_url': f'https://twitter.com/{screen_name}'
    }
    message_queue['sent'] += 1
    socket.emit(event='tweet', data=tweet, callback=client_response_callback)
    sleep(0.25)

    # Stop the stream when the client stops receiving tweets
    if message_queue['sent'] - message_queue['received'] >= MAX_TWEETS_DROPPED:
        stream.disconnect()
        socket.emit('stream disconnected')
        print('Disconnecting stream...')


def init_auth():
    global auth, stream
    if session.get('username') is not None:
        auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
        auth.set_access_token(session['access_token'], session['access_token_secret'])

        listener = FilterListener(status_callback=on_status, on_connect_callback=on_stream_connected)
        stream = tweepy.Stream(auth=auth, listener=listener)


def start_stream(keywords):
    message_queue['sent'] = 0
    message_queue['received'] = 0
    stream.filter(track=keywords)


def utc_to_local(utc_datetime):
    now = time()
    offset = datetime.fromtimestamp(now) - datetime.utcfromtimestamp(now)
    return utc_datetime + offset


if __name__ == '__main__':
    app.run(threaded=True)
