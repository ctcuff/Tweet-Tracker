# Tweet-Tracker
Like [Tweety for Android](https://github.com/ctcuff/Tweety-Android), this is a website to track the occurrences of a single or multiple keywords. How does it work? A when a user logs into Twitter, a Python server takes the auth tokens and uses those to connect to a status stream using [tweepy](https://github.com/tweepy/tweepy). When a tweet is received, that tweet is sent to the front-end via sockets.

### How do I build this?
0. Head over to [Twitter's developer site](https://developer.twitter.com/) to apply for a developer account and create a new app.
1. Go to Google's [Firebase site](https://firebase.google.com/) to create a new project.
2. In the Firebase console, navigate to the Authentication tab and enable Twitter Sign-in. Enter the API keys you (hopefully) got from step 0 and be sure to copy the callback URL as well.
3. Navigate back to Twitter's developer console and paste the callback URL from step 2 into the app's callback URL parameter.

There are 2 files are missing from this project. `config.py` and `config.js`. Create a `config.py` that looks like this:
```python
# Place this file in the root directory of this project
#
# The consumer and consumer secret keys come from the Twitter app you created
CONSUMER_KEY = ''
CONSUMER_SECRET = ''
# This is any random string. I recommend using something from the uuid library
SERVER_KEY = ''
```
In `config.js`:
```javascript
// Place this file in the /static directory of this project
//
// In the Firebase console, navigate to Settings > General. Scroll down and
// click "Add app" to add a web app. Copy the generated config, it should look
// like this.
const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};
```
