import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import '../style/Nav.css';
import { AuthStateProps } from '../store/types';

type Callback = () => void;

interface NavProps {
  onStartClick: Callback;
  onStopClick: Callback;
  onClearClick: Callback;
  onLoginClick: Callback;
  onLogoutClick: Callback;
  isLoggedIn: boolean;
}

const mapStateToProps = (state: AuthStateProps) => ({
  isLoggedIn: state.isLoggedIn
});

function Nav(props: NavProps) {
  const actions: string[] = [
    'Start',
    'Stop',
    'Clear',
    props.isLoggedIn ? 'Logout' : 'Login'
  ];

  const handlers: Callback[] = [
    props.onStartClick,
    props.onStopClick,
    props.onClearClick,
    props.isLoggedIn ? props.onLogoutClick : props.onLoginClick
  ];

  return (
    <div>
      <Navbar bg="dark" variant="dark">
        <ButtonToolbar>
          {actions.map((action: string, index: number) => (
            <Button
              key={index}
              disabled={!props.isLoggedIn && action !== 'Login'}
              variant="dark"
              size="sm"
              className="Nav_btn"
              onClick={handlers[index]}
            >
              {action}
            </Button>
          ))}
        </ButtonToolbar>
      </Navbar>
    </div>
  );
}

export default connect(mapStateToProps)(Nav);
