import React, { Component } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import "../style/CircleIndicator.css";
import axios from "axios";

export default class CircleIndicator extends Component {

  constructor(props) {
    super(props);
    this.state = {
      tooltipText: 'Stream is not running',
      backgroundColor: '#cb0021'
    };
  }

  componentDidMount() {
    const events = ['stream starting', 'stream connected', 'stream disconnected'];
    const tooltipMessage = ['Stream is starting', 'Stream is running', 'Stream is not running'];
    const colors = ['#fce51d', '#009300', '#cb0021'];

    axios.get('/status', {
      headers: { id: this.userId }
    })
      .then(resp => {
        console.log(resp);
        const running = resp.data.running;
        this.setState({
          tooltipText: running ? tooltipMessage[1] : tooltipMessage[2],
          backgroundColor: running ? colors[1] : colors[2]
        });
      })
      .catch(err => console.log(err));

    events.forEach((event, index) => {
      this.props.socket.on(event, (data) => {
        // Since the socket emits are global, we need to check
        // if this event was sent to the correct user
        if (!this.userId || this.userId !== data.id) {
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
        <Tooltip id="tooltip-bottom">
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
