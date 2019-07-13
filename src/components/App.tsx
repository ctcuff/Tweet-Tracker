import React, { Component } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from './Nav';
import FloatingButtonGroup from './FloatingButtonGroup';
import io from 'socket.io-client';
import CircleIndicator from './CircleIndicator';
import TweetCard from './TweetCard';
import { setCookie, getCookie, deleteCookie } from '../utils';
import toastr from 'toastr';
import axios from 'axios';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import '../style/App.css';
import {
  ServerTweet,
  ServerConnectResponse,
  ServerHeaders
} from '../server-types';
import LoadingOverlay from './LoadingOverlay';
import InputForm from './InputForm';

interface AppState {
  cards: JSX.Element[];
  socket: SocketIOClient.Socket;
  occurrences: number;
  isLoggedIn: boolean;
  isAuthInProgress: boolean;
  username: string;
  userId: string;
  token: string;
  tokenSecret: string;
}

type SocketCallback = (userId: string) => void;

class App extends Component<{}, AppState> {
  private readonly provider = new firebase.auth.TwitterAuthProvider();
  private isAtBottom = false;
  private keywords: string[] = [];

  state = {
    cards: [] as JSX.Element[],
    socket: io.connect(),
    occurrences: 0,
    isLoggedIn: false,
    isAuthInProgress: true,
    username: getCookie('username'),
    userId: getCookie('id'),
    token: getCookie('at'),
    tokenSecret: getCookie('ats')
  };

  constructor(props: {}) {
    super(props);

    this.state.socket.on(
      'tweet',
      (data: ServerTweet, callback: SocketCallback) => {
        // The server broadcasts tweets to everyone connected
        // so we need to check if this tweet belongs to this client
        if (data.user_id !== this.state.userId) {
          return;
        }

        // Invoke the callback to tell the server that this tweet was received
        callback(data.user_id);
        this.addCard(data);

        if (this.isAtBottom) {
          window.scrollTo(0, document.body.scrollHeight);
        }
      }
    );

    this.state.socket.on('stream connected', (data: ServerConnectResponse) => {
      if (data.user_id !== this.state.userId) return;

      toastr.success(`Listening for ${this.keywords.join(', ')}`, 'Connected');
    });
  }

  componentDidMount() {
    const { username, userId, token, tokenSecret } = this.state;
    if (username && userId && token && tokenSecret) {
      this.setState({ isLoggedIn: true });
    }
    this.setState({ isAuthInProgress: false });

    window.addEventListener('scroll', this.onWindowScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onWindowScroll);
  }

  onWindowScroll = (): void => {
    this.isAtBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight;
  };

  addCard = ({ tweet }: ServerTweet): void => {
    this.setState({
      cards: this.state.cards.concat(
        <TweetCard tweet={tweet} key={tweet.status_id} />
      ),
      occurrences: this.state.occurrences + 1
    });
  };

  startStream = () => {
    const { token, tokenSecret, userId } = this.state;
    this.state.socket.emit('start stream', {
      keywords: this.keywords,
      access_token: token,
      access_token_secret: tokenSecret,
      user_id: userId
    });
  };

  stopStream = (): void => {
    this.state.socket.emit('stop stream', {
      user_id: this.state.userId
    });
  };

  clearCards = (): void => {
    this.setState({
      cards: [],
      occurrences: 0
    });
  };

  handleLogin = (): void => {
    this.setState({ isAuthInProgress: true });

    firebase
      .auth()
      .signInWithPopup(this.provider)
      .then((result: any) => {
        const userId = result.additionalUserInfo.profile.id_str;
        const username = result.additionalUserInfo.username;
        const { accessToken, secret } = result.credential;
        const headers: ServerHeaders = {
          access_token: accessToken,
          access_token_secret: secret,
          user_id: userId
        };

        axios
          .post('login', { headers })
          .then(() => {
            this.setState({
              username: setCookie('username', username),
              userId: setCookie('id', userId),
              token: setCookie('at', accessToken),
              tokenSecret: setCookie('ats', secret),
              isLoggedIn: true
            });
            toastr.success(`Hello, @${username}`, 'Welcome');
          })
          .catch(err => {
            console.log(err);
            toastr.error(
              'An error occurred while logging in, please try again',
              'Error'
            );
          })
          .finally(() => {
            this.setState({ isAuthInProgress: false });
          });
      })
      .catch(err => {
        console.log(err);
        toastr.error(
          'An error occurred while logging in, please try again',
          'Error'
        );
        this.setState({
          isAuthInProgress: false
        });
      });
  };

  handleLogout = (): void => {
    this.setState({ isAuthInProgress: true });
    this.state.socket.emit('stop stream', { userId: this.state.userId });

    axios
      .get('/logout')
      .then(() => {
        this.setState({
          username: deleteCookie('username'),
          userId: deleteCookie('id'),
          token: deleteCookie('at'),
          tokenSecret: deleteCookie('ats'),
          isLoggedIn: false,
          cards: [],
          occurrences: 0
        });
      })
      .catch(err => {
        console.log(err);
        toastr.error('An error occurred while logging out', 'error');
      })
      .finally(() => {
        this.setState({ isAuthInProgress: false });
      });
  };

  updateKeywords = (e: React.FormEvent<HTMLFormElement>): void => {
    this.keywords = e.currentTarget.value
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  };

  render() {
    const {
      username,
      isLoggedIn,
      occurrences,
      socket,
      userId,
      cards,
      isAuthInProgress
    } = this.state;
    return (
      <div>
        <Nav
          onStartClick={this.startStream}
          onStopClick={this.stopStream}
          onLoginClick={this.handleLogin}
          onLogoutClick={this.handleLogout}
          onClearClick={this.clearCards}
          isLoggedIn={isLoggedIn}
        />
        <InputForm isLoggedIn={isLoggedIn} onChange={this.updateKeywords} />
        <h3>
          Occurrences: <span>{occurrences}</span>
          <CircleIndicator socket={socket} userId={userId} />
        </h3>
        <p className="App_display-username" hidden={!isLoggedIn}>
          Signed in as {}
          <a
            target="_blank"
            href={`https://twitter.com/${username}`}
            rel="noopener noreferrer"
          >
            @{username}
          </a>
        </p>
        <Container fluid={true} className="App_container">
          {cards}
        </Container>
        <FloatingButtonGroup />
        <LoadingOverlay show={!isAuthInProgress} />
      </div>
    );
  }
}

export default App;
