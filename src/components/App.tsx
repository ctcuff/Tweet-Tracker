import React, { Component } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from './Nav';
import FloatingButtonGroup from './FloatingButtonGroup';
import CircleIndicator from './CircleIndicator';
import TweetCard from './TweetCard';
import toastr from 'toastr';
import '../style/App.css';
import { ServerTweet, ServerConnectResponse } from '../server-types';
import LoadingOverlay from './LoadingOverlay';
import InputForm from './InputForm';
import { login, logout } from '../store/actions';
import { connect } from 'react-redux';
import { AuthStateProps } from '../store/types';

const mapDispatchToProps = (dispatch: (func: any) => void) => ({
  login: () => dispatch(login()),
  logout: () => dispatch(logout())
});

const mapStateToProps = (state: AuthStateProps) => ({
  isAuthInProgress: state.isAuthInProgress,
  username: state.username,
  userId: state.userId,
  token: state.token,
  tokenSecret: state.tokenSecret,
  isLoggedIn: state.isLoggedIn,
  socket: state.socket
});

interface AppState {
  cards: JSX.Element[];
  occurrences: number;
}

interface AppProps {
  login: () => void;
  logout: () => void;
  isLoggedIn: boolean;
  username: string;
  userId: string;
  token: string;
  tokenSecret: string;
  socket: SocketIOClient.Socket;
}

type SocketCallback = (userId: string) => void;

class App extends Component<AppProps, AppState> {
  private isAtBottom = false;
  private keywords: string[] = [];

  state = {
    cards: [] as JSX.Element[],
    occurrences: 0
  };

  constructor(props: AppProps) {
    super(props);
    const { socket, userId } = this.props;

    socket.on('tweet', (data: ServerTweet, callback: SocketCallback) => {
      // The server broadcasts tweets to everyone connected
      // so we need to check if this tweet belongs to this client
      if (data.user_id !== userId) {
        return;
      }

      // Invoke the callback to tell the server that this tweet was received
      callback(data.user_id!);
      this.addCard(data);

      if (this.isAtBottom) {
        window.scrollTo(0, document.body.scrollHeight);
      }
    });

    socket.on('stream connected', (data: ServerConnectResponse) => {
      if (data.user_id !== userId) {
        return;
      }

      toastr.success(`Listening for ${this.keywords.join(', ')}`, 'Connected');
    });
  }

  componentDidMount() {
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
    const { token, tokenSecret, userId, socket } = this.props;

    socket.emit('start stream', {
      keywords: this.keywords,
      access_token: token,
      access_token_secret: tokenSecret,
      user_id: userId
    });
  };

  stopStream = (): void => {
    const { socket, userId } = this.props;
    socket.emit('stop stream', { user_id: userId });
  };

  clearCards = (): void => {
    this.setState({
      cards: [],
      occurrences: 0
    });
  };

  handleLogout = (): void => {
    const { socket, logout, userId } = this.props;
    socket.emit('stop stream', { user_id: userId });
    this.clearCards();
    logout();
  };

  updateKeywords = (e: React.FormEvent<HTMLFormElement>): void => {
    this.keywords = e.currentTarget.value
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  };

  render() {
    const { occurrences, cards } = this.state;
    const { login, isLoggedIn, username } = this.props;
    return (
      <div>
        <Nav
          onStartClick={this.startStream}
          onStopClick={this.stopStream}
          onLoginClick={login}
          onLogoutClick={this.handleLogout}
          onClearClick={this.clearCards}
        />
        <InputForm onChange={this.updateKeywords} />
        <h3>
          Occurrences: <span>{occurrences}</span>
          <CircleIndicator />
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
        <LoadingOverlay />
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App);
