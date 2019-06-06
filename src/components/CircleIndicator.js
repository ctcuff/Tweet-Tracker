import React, { Component } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

const $ = window.$;

export default class CircleIndicator extends Component {

  constructor(props) {
    super(props);
    this.state = {
      tooltipText: 'Stream is not running',
      style: {
        borderRadius: '50%',
        width: '10px',
        height: '10px',
        margin: '0 0 3px 12px',
        display: 'inline-block',
        backgroundColor: '#cb0021'
      }
    };
  }

  componentDidMount() {
    const events = ['stream starting', 'stream connected', 'stream disconnected'];
    const tooltipMessage = ['Stream is starting', 'Stream is running', 'Stream is not running'];
    const colors = ['#fce51d', '#009300', '#cb0021'];

    // The stream might still might be running when the user
    // leaves and returns so it needs to be checked
    $.get('/status', resp => {
      this.setState({
        tooltipText: resp.running ? tooltipMessage[1] : tooltipMessage[2],
        style: {
          ...this.state.style,
          backgroundColor: resp.running ? colors[1] : colors[2]
        }
      });
    });

    events.forEach((event, index) => {
      this.props.socket.on(event, (data) => {
        // Since the socket emits are global, we need to check
        // if this event was sent to the correct user
        if (!this.id || this.id !== data.id) {
          return;
        }
        this.setState({
          tooltipText: tooltipMessage[index],
          style: {
            ...this.state.style,
            backgroundColor: colors[index]
          }
        });
      });
    });
  }

  render() {
    this.id = this.props.id;

    const tooltip = (
        <Tooltip id="tooltip-bottom">
          {this.state.tooltipText}
        </Tooltip>
    );
    return (
        <OverlayTrigger overlay={tooltip}>
          <span style={this.state.style}/>
        </OverlayTrigger>
    );
  }
}
