import React, { Component } from "react";
import Container from "react-bootstrap/Container";
import Nav from "./Nav";
import FloatingButtonGroup from "./FloatingButtonGroup";
import io from "socket.io-client";
import Form from "react-bootstrap/Form";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import CircleIndicator from "./CircleIndicator";
import TweetCard from "./TweetCard";
import { setCookie, getCookie, deleteCookie } from "../utils";
import toastr from 'toastr';
import axios from 'axios';
import * as firebase from 'firebase/app';
import "firebase/auth";
import firebaseConfig from "../config";
import "../style/App.css";

firebase.initializeApp(firebaseConfig);

type AppState = {
  cards: JSX.Element[];
  socket: SocketIOClient.Socket;
  occurrences: number;
  isLoggedIn: boolean;
  isAuthInProgress: boolean;
  username: string;
  id: string;
  token: string;
  tokenSecret: string;
}

type SocketCallback = (id: string) => void;

export default class App extends Component<{}, AppState> {
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
    id: getCookie('id'),
    token: getCookie('at'),
    tokenSecret: getCookie('ats')
  };

  constructor(props: {}) {
    super(props);

    this.state.socket.on('tweet', (data: any, callback: SocketCallback) => {
      const tweet = data.tweet;

      // The server broadcasts tweets to everyone connected
      // so we need to check if this tweet belongs to this client
      if (data.id !== this.state.id)
        return;

      // Invoke the callback to tell the server that this tweet was received
      callback(data.id);
      this.addCard(tweet);

      if (this.isAtBottom) {
        window.scrollTo(0, document.body.scrollHeight);
      }
    });

    this.state.socket.on('stream connected', (data: any) => {
      if (data.id !== this.state.id)
        return;

      toastr.success(`Listening for ${this.keywords.join(', ')}`, 'Connected');
    });
  }

  componentDidMount() {
    const { username, id, token, tokenSecret } = this.state;
    if (username && id && token && tokenSecret) {
      this.setState({ isLoggedIn: true });
    }
    this.setState({ isAuthInProgress: false });

    window.addEventListener('scroll', this.onWindowScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onWindowScroll);
  }

  onWindowScroll = (): void => {
    this.isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;
  };

  addCard = (tweet: any): void => {
    this.setState({
      cards: this.state.cards.concat(<TweetCard tweet={tweet} key={tweet.id}/>),
      occurrences: this.state.occurrences + 1
    });
  };

  startStream = () => {
    const { token, tokenSecret, id } = this.state;
    this.state.socket.emit('start stream', {
      keywords: this.keywords,
      access_token: token,
      access_token_secret: tokenSecret,
      id: id
    });
  };

  stopStream = (): void => {
    this.state.socket.emit('stop stream', { id: this.state.id });
  };

  clearCards = (): void => {
    this.setState({
      cards: [],
      occurrences: 0
    });
  };

  handleLogin = (): void => {
    this.setState({ isAuthInProgress: true });

    firebase.auth().signInWithPopup(this.provider).then((result:any) => {
      const id = result.additionalUserInfo.profile.id_str;
      const username = result.additionalUserInfo.username;
      const { accessToken, secret } = result.credential;
      const headers = {
        headers: {
          access_token: accessToken,
          access_token_secret: secret,
          id: id
        }
      };

      axios.post('login', headers)
        .then(() => {
          this.setState({
            username: setCookie('username', username),
            id: setCookie('id', id),
            token: setCookie('at', accessToken),
            tokenSecret: setCookie('ats', secret),
            isLoggedIn: true
          });
          toastr.success(`Hello, @${username}`, 'Welcome');
        })
        .catch(err => {
          console.log(err);
          toastr.error('An error occurred while logging in, please try again', 'Error');
        })
        .finally(() => {
          this.setState({ isAuthInProgress: false });
        });

    }).catch(err => {
      console.log(err);
      toastr.error('An error occurred while logging in, please try again', 'Error');
      this.setState({
        isAuthInProgress: false
      });
    });
  };

  handleLogout = (): void => {
    this.setState({ isAuthInProgress: true });
    this.state.socket.emit('stop stream', { id: this.state.id });

    axios.get('/logout')
      .then(() => {
        this.setState({
          username: deleteCookie('username'),
          id: deleteCookie('id'),
          token: deleteCookie('at'),
          tokenSecret: deleteCookie('ats'),
          isLoggedIn: false,
          cards: [],
          occurrences: 0,
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

  updateKeywords = (e: any): void => {
    this.keywords = e.target
      .value
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  };

  render() {
    const tooltip = (
      <Tooltip id="tooltip-bottom">
        {this.state.isLoggedIn ? "Separate multiple words with commas": "You need log in first"}
      </Tooltip>
    );

    const username = this.state.username;

    return (
      <div>
        <Nav
          onStartClick={this.startStream}
          onStopClick={this.stopStream}
          onLoginClick={this.handleLogin}
          onLogoutClick={this.handleLogout}
          onClearClick={this.clearCards}
          isLoggedIn={this.state.isLoggedIn}
        />
        <OverlayTrigger placement="bottom" overlay={tooltip}>
          <Form.Control
            placeholder="Keyword(s):"
            type="text"
            className="input-container"
            onChange={this.updateKeywords}
          />
        </OverlayTrigger>
        <h3>
          Occurrences: <span>{this.state.occurrences}</span>
          <CircleIndicator socket={this.state.socket} userId={this.state.id}/>
        </h3>
        <p style={{ display: this.state.isLoggedIn ? 'block' : 'none' }} className="App_display-username">
          Signed in as
          <a target="_blank" href={`https://twitter.com/${username}`} rel="noopener noreferrer">
            @{username}
          </a>
        </p>
        <Container fluid={true} className="App_container">
          {this.state.cards}
        </Container>
        <FloatingButtonGroup/>
        <div style={{ display: this.state.isAuthInProgress ? 'block' : 'none' }} className="App_overlay">
          <div>
            <svg viewBox="25 25 50 50">
              <circle cx="50" cy="50" r="20"/>
            </svg>
          </div>
        </div>
      </div>
    );
  }
}
