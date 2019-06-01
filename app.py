import tweepy
import socketio
from flask import Flask, render_template, redirect, url_for, request, jsonify, session
from config import *
from filter_listener import FilterListener
from time import sleep, time
from datetime import datetime
from users import User

app = Flask(__name__)
app.secret_key = SERVER_KEY
socket = socketio.Server(async_mode='threading')
app.wsgi_app = socketio.Middleware(socket, app.wsgi_app)
users = {}
# The maximum number of tweets not received by the client
# before the server stops the stream
MAX_TWEETS_DROPPED = 10


@app.route('/')
def index():
    print(f'ID: {session.get("id")}')
    print(users)
    return render_template('index.html')


@app.route('/login', methods=['POST'])
def login():
    access_token = request.headers.get('access_token')
    access_token_secret = request.headers.get('access_token_secret')
    user_id = request.headers.get('id')

    if not access_token or not access_token_secret or not user_id:
        return jsonify({'error': 'Missing or invalid headers'})

    init_auth(user_id, access_token, access_token_secret)
    session['id'] = user_id

    return jsonify({'status': 200})


@app.route('/logout')
def logout():
    if 'id' in session:
        user_id = session.pop('id')

        if user_id in users:
            user = users[user_id]
            if user.stream.running:
                user.stream.disconnect()
            del users[user_id]

    return redirect(url_for('index'))


@app.route('/status', methods=['GET'])
def get_stream_status():
    user_id = request.headers.get('id')
    running = False

    if user_id in users:
        running = users[user_id].stream.running

    return jsonify({'running': running})


@app.route('/get_username', methods=['GET'])
def get_username():
    access_token = request.headers.get('access_token')
    access_token_secret = request.headers.get('access_token_secret')
    user_id = request.headers.get('id')

    if not access_token or not access_token_secret:
        return jsonify({'error': 'Missing or invalid headers'})

    init_auth(user_id, access_token, access_token_secret)

    return jsonify({'username': users[user_id].username})


@socket.on('start stream')
def start(pid, params):
    user_id = params['id']
    init_auth(user_id, params['access_token'], params['access_token_secret'])
    user = users[user_id]

    if user.stream.running:
        return

    user.stream.filter(track=params['keywords'])
    user.messages_received = 0
    user.messages_sent = 0


@socket.on('stop stream')
def stop_stream(pid, params):
    user = users[params['id']]
    if user.stream.running:
        user.stream.disconnect()
        print(f"Stopping @{user.username}'s stream")


def client_response_callback(user_id):
    users[user_id].messages_received += 1


def on_stream_connected(user_id):
    socket.emit('stream connected', data={'id': user_id})


def on_status(user_id, status):
    user = users[user_id]
    screen_name = status.user.screen_name
    data = {
        'id': user_id,
        'tweet': {
            # Twitter returns dates as "Sat May 04 17:17:10 +0000 2019" so this
            # formats it as 'Sat May 04, 2019 - 10:07 PM
            'created_at': utc_to_local(status.created_at).strftime('%a %b %d, %Y - %I:%M %p'),
            'id': status.id_str,
            'text': status.text,
            'screen_name': screen_name,
            'tweet_url': f'https://twitter.com/{screen_name}/status/{status.id_str}',
            'profile_url': f'https://twitter.com/{screen_name}'
        }
    }
    user.messages_sent += 1
    socket.emit(event='tweet', data=data, callback=client_response_callback)
    sleep(0.25)

    # Stop the stream when the client stops receiving tweets
    if user.messages_sent - user.messages_received >= MAX_TWEETS_DROPPED:
        user.stream.disconnect()
        socket.emit('stream disconnected', data={'id': user_id})
        print(f"Disconnecting @{user.username}'s stream...")


def init_auth(user_id, access_token, access_token_secret):
    if user_id not in users:
        auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
        auth.set_access_token(access_token, access_token_secret)
        listener = FilterListener(status_callback=on_status, on_connect_callback=on_stream_connected, user_id=user_id)
        stream = tweepy.Stream(auth=auth, listener=listener)

        users[user_id] = User(auth.get_username(), stream)


def utc_to_local(utc_datetime):
    now = time()
    offset = datetime.fromtimestamp(now) - datetime.utcfromtimestamp(now)
    return utc_datetime + offset


if __name__ == '__main__':
    app.run()
