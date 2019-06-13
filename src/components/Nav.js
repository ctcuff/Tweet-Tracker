import React, { Component } from "react";
import Navbar from "react-bootstrap/Navbar";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import Button from "react-bootstrap/Button";
import "../styles/Nav.css";

export default class Nav extends Component {
  render() {
    const {
      onStartClick,
      onStopClick,
      onClearClick,
      onLoginClick,
      onLogoutClick,
      isLoggedIn
    } = this.props;

    const actions = ['Start', 'Stop', 'Clear', isLoggedIn ? 'Logout' : 'Login'];
    const handlers = [
      onStartClick,
      onStopClick,
      onClearClick,
      isLoggedIn ? onLogoutClick : onLoginClick
    ];

    return (
        <div>
          <Navbar bg="dark" variant="dark">
            <ButtonToolbar>
              {actions.map((action, index) =>
                  <Button
                      key={index}
                      disabled={!isLoggedIn && action !== 'Login'}
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