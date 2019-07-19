import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import './style/index.css';
import * as firebase from 'firebase/app';
import firebaseConfig from './config';
import { Provider } from 'react-redux';
import store from './store/index';

firebase.initializeApp(firebaseConfig);

function Footer() {
  return (
    <div>
      <span className="fa fa-github fa-lg" />
      <a
        href="https://github.com/ctcuff/Tweet-Tracker"
        target="_blank"
        rel="noopener noreferrer"
      >
        View source on GitHub
      </a>
    </div>
  );
}

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
ReactDOM.render(<Footer />, document.getElementById('footer'));
