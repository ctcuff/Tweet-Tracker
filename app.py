import tweepy
import socketio
from flask import Flask, render_template, redirect, url_for, request, jsonify
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
    return render_template('index.html')


@app.route('/login', methods=['POST'])
def login():
    access_token = request.headers.get('access_token')
    access_token_secret = request.headers.get('access_token_secret')

    if not access_token or not access_token_secret:
        return jsonify({'error': 'Missing or invalid headers'})

    init_auth(access_token, access_token_secret)

    return jsonify({'status': 200})


@app.route('/logout')
def logout():
    global auth
    auth = None
    if stream is not None and stream.running:
        stream.disconnect()
    return redirect(url_for('index'))


@app.route('/status')
def get_stream_status():
    return jsonify({'running': stream is not None and stream.running})


@app.route('/get_username', methods=['GET'])
def get_username():
    access_token = request.headers.get('access_token')
    access_token_secret = request.headers.get('access_token_secret')

    if not access_token or not access_token_secret:
        return jsonify({'error': 'Missing or invalid headers'})

    init_auth(access_token, access_token_secret)

    return jsonify({'username': auth.get_username()})


@socket.on('start stream')
def start(data, params):
    print('Starting...')
    print(f'data: {data}, param: {params}')

    init_auth(params['access_token'], params['access_token_secret'])

    if stream is None or stream.running:
        print('Stream uninitialized or already running')
        return

    thread = Thread(target=start_stream, args=(params['keywords'],))
    thread.start()


@socket.on('stop stream')
def stop_stream(data):
    print('Stopping...')
    if stream is not None and stream.running:
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


def init_auth(access_token, access_token_secret):
    global auth, stream
    if auth is None:
        auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
        auth.set_access_token(access_token, access_token_secret)
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
