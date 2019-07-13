import React, { Component } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import "../style/CircleIndicator.css";
import axios from "axios";
import {
  ServerHeaders,
  ServerResponse,
  SocketResponse
} from "../server-types";

const tooltipMessage = [
  'Stream is starting',
  'Stream is running',
  'Stream is not running'
];
const colors = ['#fce51d', '#009300', '#cb0021'];

interface CircleIndicatorProps {
  socket: SocketIOClient.Socket;
  userId: string;
}

interface CircleIndicatorState {
  tooltipText: typeof tooltipMessage[number];
  backgroundColor: typeof colors[number];
}

export default class CircleIndicator extends Component<CircleIndicatorProps, CircleIndicatorState> {
  private userId: string;

  constructor(props: CircleIndicatorProps) {
    super(props);
    this.state = {
      tooltipText: 'Stream is not running',
      backgroundColor: '#cb0021'
    };
    this.userId = '';
  }

  componentDidMount() {
    const events = ['stream starting', 'stream connected', 'stream disconnected'];
    const headers: ServerHeaders = {
      user_id: this.userId
    };

    axios.get('/status', { headers })
      .then((resp: ServerResponse) => {
        const running = resp.data.running;
        this.setState({
          tooltipText: running ? tooltipMessage[1] : tooltipMessage[2],
          backgroundColor: running ? colors[1] : colors[2]
        });
      })
      .catch(err => console.log(err));

    events.forEach((event: string, index: number) => {
      this.props.socket.on(event, (resp: SocketResponse) => {
        // Since the socket emits are global, we need to check
        // if this event was sent to the correct user
        if (!this.userId || this.userId !== resp.user_id) {
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
    this.userId = this.props.userId;

    const tooltip = (
      <Tooltip id="tooltip-bottom" placement="auto">
        {this.state.tooltipText}
      </Tooltip>
    );

    return (
      <OverlayTrigger overlay={tooltip}>
        <span style={{ backgroundColor: this.state.backgroundColor }} className="CircleIndicator"/>
      </OverlayTrigger>
    );
  }
}