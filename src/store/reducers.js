import { getCookie } from '../utils';
import io from 'socket.io-client';

const initialState = {
  isAuthInProgress: false,
  username: getCookie('username'),
  userId: getCookie('id'),
  token: getCookie('at'),
  tokenSecret: getCookie('ats'),
  isLoggedIn: false,
  socket: io.connect()
};

const { username, userId, token, tokenSecret } = initialState;

if (username && userId && token && tokenSecret) {
  initialState.isLoggedIn = true;
}

const reducer = (state = initialState, action) => {
  if (action.type === 'AUTH') {
    return Object.assign({}, state, {
      ...state,
      ...action.payload
    });
  }
  return state;
};

export default reducer;
