# TODO: Detect when tweet stop being received so the server can log the user out

import tweepy
import requests
import socketio
from flask import Flask, render_template, session, redirect, url_for, request, jsonify
from flask_cors import CORS
from config import *
from filter_listener import FilterListener
from threading import Thread
from time import sleep, time

app = Flask(__name__)
app.secret_key = SERVER_KEY
socket = socketio.Server(async_mode='threading')
app.wsgi_app = socketio.Middleware(socket, app.wsgi_app)

CORS(app)
TWEET_RECEIVE_TIMEOUT = 10
auth = None
stream = None
last_tweet_time = 0


@app.route('/')
def index():
    print(session.get('username'))
    return render_template('index.html', username=session.get('username'))


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
    global last_tweet_time
    print('Stopping...')
    if stream is None or not stream.running:
        print('Stream uninitialized or already stopped')
        return
    stream.disconnect()
    last_tweet_time = 0


@socket.on('tweet received')
def tweet_received(data):
    global last_tweet_time
    last_tweet_time = time()
    print('The client got the message')


def stream_callback(status):
    global last_tweet_time
    print(last_tweet_time)

    if last_tweet_time == 0:
        last_tweet_time = time() + TWEET_RECEIVE_TIMEOUT

    if time() - last_tweet_time >= TWEET_RECEIVE_TIMEOUT:
        print('The client has left')
        stream.disconnect()
        requests.get('http://localhost:5000/clear_session')
        return

    screen_name = status.user.screen_name
    status_id = status.id_str
    tweet = {
        # Twitter returns dates as "Sat May 04 17:17:10 +0000 2019" so this
        # formats it as 'May, 04 2019 - 10:07:44 PM
        'created_at': status.created_at.strftime('%b, %d %Y - %I:%M:%S %p'),
        'id': status.id_str,
        'text': status.text,
        'screen_name': screen_name,
        'tweet_url': f'https://twitter.com/{screen_name}/status/{status_id}',
        'profile_url': f'https://twitter.com/{screen_name}'
    }
    socket.emit(event='tweet', data=tweet)
    sleep(0.25)
    print(f'[@{screen_name}] {status.text}')


def init_auth():
    global auth, stream
    if session.get('username') is not None:
        auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
        auth.set_access_token(session['access_token'], session['access_token_secret'])

        listener = FilterListener(stream_callback)
        stream = tweepy.Stream(auth=auth, listener=listener)


def start_stream(keywords):
    stream.filter(track=keywords)


if __name__ == '__main__':
    app.run(threaded=True)
