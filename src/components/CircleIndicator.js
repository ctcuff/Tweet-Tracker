import React, { Component } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import "../style/CircleIndicator.css";

const $ = window.$;
const url = 'http://127.0.0.1:5000';

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
    const data = {
      url: url + '/status',
      headers: {
        id: this.userId
      }
    };

    // The stream might still might be running when the user
    // leaves and returns so it needs to be checked
    $.get(data, (resp) => {
      console.log(resp);
      this.setState({
        tooltipText: resp.running ? tooltipMessage[1] : tooltipMessage[2],
        backgroundColor: resp.running ? colors[1] : colors[2]
      });
    });

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
