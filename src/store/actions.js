import axios from 'axios';
import { deleteCookie, setCookie } from '../utils';
import toastr from 'toastr';
import * as firebase from 'firebase/app';
import 'firebase/auth';

const AUTH = 'AUTH';
const provider = new firebase.auth.TwitterAuthProvider();

function login() {
  return function(dispatch) {
    dispatch({
      type: AUTH,
      payload: {
        isAuthInProgress: true
      }
    });
    return firebase
      .auth()
      .signInWithPopup(provider)
      .then(result => {
        const userId = result.additionalUserInfo.profile.id_str;
        const username = result.additionalUserInfo.username;
        const { accessToken, secret } = result.credential;
        const headers = {
          access_token: accessToken,
          access_token_secret: secret,
          user_id: userId
        };

        axios
          .post('login', { headers })
          .then(() => {
            dispatch({
              type: AUTH,
              payload: {
                username: setCookie('username', username),
                userId: setCookie('id', userId),
                token: setCookie('at', accessToken),
                tokenSecret: setCookie('ats', secret),
                isLoggedIn: true
              }
            });
            toastr.success(`Hello, @${username}`, 'Welcome');
          })
          .catch(err => {
            console.log(err);
            toastr.error(
              'An error occurred while logging in, please try again',
              'Error'
            );
          })
          .finally(() => {
            dispatch({
              type: AUTH,
              payload: {
                isAuthInProgress: false
              }
            });
          });
      })
      .catch(err => {
        console.log(err);
        toastr.error(
          'An error occurred while logging in, please try again',
          'Error'
        );
        dispatch({
          type: AUTH,
          payload: {
            isAuthInProgress: false
          }
        });
      });
  };
}

function logout() {
  return function(dispatch) {
    dispatch({
      type: AUTH,
      payload: {
        isAuthInProgress: true
      }
    });

    return axios
      .get('/logout')
      .then(() => {
        dispatch({
          type: AUTH,
          payload: {
            username: deleteCookie('username'),
            userId: deleteCookie('id'),
            token: deleteCookie('at'),
            tokenSecret: deleteCookie('ats'),
            isLoggedIn: false
          }
        });
      })
      .catch(err => {
        console.log(err);
        toastr.error('An error occurred while logging out', 'error');
      })
      .finally(() => {
        dispatch({
          type: AUTH,
          payload: {
            isAuthInProgress: false
          }
        });
      });
  };
}
export { login, logout };
