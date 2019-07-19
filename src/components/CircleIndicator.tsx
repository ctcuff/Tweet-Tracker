import React, { Component } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import '../style/CircleIndicator.css';
import axios from 'axios';
import { connect } from 'react-redux';
import { ServerHeaders, ServerResponse, SocketResponse } from '../server-types';

const mapStateToProps = (state: any) => ({
  socket: state.socket,
  userId: state.userId
});

const tooltipMessage = [
  'Stream is starting',
  'Stream is running',
  'Stream is not running'
];

const colors = ['#fce51d', '#009300', '#cb0021'];

interface CircleIndicatorProps {
  socket?: SocketIOClient.Socket;
  userId?: string;
}

interface CircleIndicatorState {
  tooltipText: typeof tooltipMessage[number];
  backgroundColor: typeof colors[number];
}

class CircleIndicator extends Component<CircleIndicatorProps, CircleIndicatorState> {
  state = {
    tooltipText: 'Stream is not running',
    backgroundColor: '#cb0021'
  };

  componentDidMount() {
    const events = [
      'stream starting',
      'stream connected',
      'stream disconnected'
    ];

    const headers: ServerHeaders = {
      user_id: this.props.userId!
    };

    axios
      .get('/status', { headers })
      .then((resp: ServerResponse) => {
        const running = resp.data.running;
        this.setState({
          tooltipText: running ? tooltipMessage[1] : tooltipMessage[2],
          backgroundColor: running ? colors[1] : colors[2]
        });
      })
      .catch(err => console.log(err));

    events.forEach((event: string, index: number) => {
      this.props.socket &&
        this.props.socket.on(event, (resp: SocketResponse) => {
          // Since the socket emits are global, we need to check
          // if this event was sent to the correct user
          if (!this.props.userId || this.props.userId !== resp.user_id) {
            return;
          }
          this.setState({
            tooltipText: tooltipMessage[index],
            backgroundColor: colors[index]
          });
        });
    });
  }

  render() {
    const tooltip = (
      <Tooltip id="tooltip-bottom" placement="auto">
        {this.state.tooltipText}
      </Tooltip>
    );

    return (
      <OverlayTrigger overlay={tooltip}>
        <span
          style={{ backgroundColor: this.state.backgroundColor }}
          className="CircleIndicator"
        />
      </OverlayTrigger>
    );
  }
}

export default connect(mapStateToProps)(CircleIndicator);
