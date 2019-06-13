import * as firebase from "firebase/app";
import "firebase/auth";
import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import firebaseConfig from "./config";
import "./style/index.css";

firebase.initializeApp(firebaseConfig);

const provider = new firebase.auth.TwitterAuthProvider();

function Footer() {
  return (
    <div>
      <span className="fa fa-github fa-lg"/>
      <a href="https://github.com/ctcuff/Tweet-Tracker" target="_blank" rel="noopener noreferrer">
        View source on GitHub
      </a>
    </div>
  );
}

ReactDOM.render(
  <App provider={provider} firebase={firebase} id="entry"/>,
  document.getElementById('root')
);

ReactDOM.render(
  <Footer/>,
  document.getElementById('footer')
);