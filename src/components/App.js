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
import "../style/App.css";

// Import jQuery so we can use its get/post functions
// because those are compatible with Internet Explorer
const { toastr, $ } = window;
const url = 'http://127.0.0.1:5000';

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      cards: [],
      socket: io.connect(url),
      occurrences: 0,
      isLoggedIn: false,
      isAuthInProgress: true,
      username: getCookie('username'),
      id: getCookie('id'),
      token: getCookie('at'),
      tokenSecret: getCookie('ats'),
    };

    this.isAtBottom = false;

    this.state.socket.on('tweet', (data, callback) => {
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

    this.state.socket.on('stream connected', (data) => {
      if (data.id !== this.state.id)
        return;

      toastr.success(`Listening for ${this.keywords.join(', ')}`, 'Connected');
    });

    window.onscroll = () => {
      this.isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;
    };
  }

  componentDidMount() {
    const { username, id, token, tokenSecret } = this.state;
    if (username && id && token && tokenSecret) {
      this.setState({ isLoggedIn: true });
    }
    this.setState({ isAuthInProgress: false });
  }

  addCard = (tweet) => {
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

  stopStream = () => {
    this.state.socket.emit('stop stream', { id: this.state.id });
  };

  clearCards = () => {
    this.setState({
      cards: [],
      occurrences: 0
    });
  };

  handleLogin = () => {
    const { firebase, provider } = this.props;
    this.setState({ isAuthInProgress: true });

    firebase.auth().signInWithPopup(provider).then(result => {
      const id = result.additionalUserInfo.profile.id_str;
      const username = result.additionalUserInfo.username;
      const { accessToken, secret } = result.credential;
      const payload = {
        url: url + '/login',
        headers: {
          access_token: accessToken,
          access_token_secret: secret,
          id: id
        }
      };

      $.post(payload)
          .done(() => {
            this.setState({
              username: setCookie('username', username),
              id: setCookie('id', id),
              token: setCookie('at', accessToken),
              tokenSecret: setCookie('ats', secret),
              isLoggedIn: true
            });
            toastr.success(`Hello, @${username}`, 'Welcome');
          })
          .fail(err => {
            console.log(err);
            toastr.error('An error occurred while logging in, please try again', 'Error');
          })
          .always(() => {
            this.setState({ isAuthInProgress: false })
          });

    }).catch((err) => {
      console.log(err);
      toastr.error('An error occurred while logging in, please try again', 'Error');
      this.setState({
        isAuthInProgress: false
      });
    });
  };

  handleLogout = () => {
    this.setState({ isAuthInProgress: true });
    this.state.socket.emit('stop stream', { id: this.state.id });

    $.get(url + '/logout')
        .done(() => {
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
        .fail(err => {
          console.log(err);
          toastr.error('An error occurred while logging out', 'error');
        })
        .always(() => {
          this.setState({ isAuthInProgress: false });
        });
  };

  updateKeywords = (e) => {
    this.keywords = e.target
        .value
        .split(',')
        .map(str => str.trim())
        .filter(str => str.length > 0);
  };

  render() {
    const tooltip = (
        <Tooltip id="tooltip-bottom">
          Separate multiple words with commas
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