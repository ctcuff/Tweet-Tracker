import React, { Component } from "react";
import Button from "react-bootstrap/Button";
import arrowUp from "../static/baseline-arrow_upward-24px.svg";
import arrowDown from "../static/baseline-arrow_downward-24px.svg";
import "../static/FloatingButton.css";

export default class FloatingButtonGroup extends Component {

  constructor(props) {
    super(props);
    this.scrollTop = this.scrollTop.bind(this);
    this.scrollBottom = this.scrollBottom.bind(this);
  }

  scrollTop() {
    window.scrollTo(0, 0);
  }

  scrollBottom() {
    window.scroll(0, document.body.scrollHeight);
  }

  render() {
    return (
      <div>
        <Button variant="light" onClick={this.scrollTop} id="fab-up" className="shadow">
          <img src={arrowUp} alt=""/>
        </Button>
        <Button variant="light" onClick={this.scrollBottom} id="fab-down" className="shadow">
          <img src={arrowDown} alt=""/>
        </Button>
      </div>
    );
  }
}