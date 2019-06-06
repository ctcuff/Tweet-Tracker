import React from "react";
import Card from "react-bootstrap/Card";

export default function TweetCard(props) {
  const tweet = props.tweet;
  const style = {
    width: '18rem',
    border: '1px solid black',
    cursor: 'pointer',
    margin: '16px',
    flex: '1 1 auto',
  };
  return (
    <Card style={style}>
      <Card.Body onClick={(event) => {
        // Don't let the <a> tag trigger this click listener since
        // it'll cause 2 windows to open
        if (event.target.tagName.toLocaleLowerCase() === 'a') {
          return;
        }
        const win = window.open(tweet.tweet_url, '_blank');
        // Make sure the browser can actually open new windows
        if (win !== null) {
          win.focus();
        }
      }}>
        <Card.Title>@{tweet.screen_name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">{tweet.created_at}</Card.Subtitle>
        <Card.Text>{tweet.text}</Card.Text>
        <Card.Link href={tweet.profile_url} target="_blank">View profile</Card.Link>
      </Card.Body>
    </Card>
  );
}