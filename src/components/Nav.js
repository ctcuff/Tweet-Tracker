import React, { Component } from "react";
import Navbar from "react-bootstrap/Navbar";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import Button from "react-bootstrap/Button";
import "../style/Nav.css";

export default class Nav extends Component {
  render() {
    const actions = ['Start', 'Stop', 'Clear', this.props.isLoggedIn ? 'Logout' : 'Login'];
    const handlers = [
      this.props.onStartClick,
      this.props.onStopClick,
      this.props.onClearClick,
      this.props.isLoggedIn ? this.props.onLogoutClick : this.props.onLoginClick
    ];

    return (
        <div>
          <Navbar bg="dark" variant="dark">
            <ButtonToolbar>
              {actions.map((action, index) =>
                  <Button
                      key={index}
                      disabled={!this.props.isLoggedIn && action !== 'Login'}
                      variant="dark"
                      size="sm"
                      className="Nav_btn"
                      onClick={handlers[index]}
                  >
                    {action}
                  </Button>
              )}
            </ButtonToolbar>
          </Navbar>
        </div>
    );
  }
}