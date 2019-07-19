import React from 'react';
import Card from 'react-bootstrap/Card';
import '../style/TweetCard.css';
import { ServerTweet } from '../server-types';

const TweetCard = (data: ServerTweet) => {
  const { tweet_url, screen_name, created_at, text, profile_url } = data.tweet;
  return (
    <Card className="TweetCard">
      <Card.Body
        onClick={(event: React.MouseEvent) => {
          // Don't let the <a> tag trigger this click listener since
          // it'll cause 2 windows to open
          if (event.currentTarget.tagName.toLowerCase() === 'a') {
            return;
          }
          const win = window.open(tweet_url, '_blank');
          // Make sure the browser can actually open new windows
          if (win !== null) {
            win.focus();
          }
        }}
      >
        <Card.Title>@{screen_name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">{created_at}</Card.Subtitle>
        <Card.Text>{text}</Card.Text>
        <Card.Link href={profile_url} target="_blank" rel="noopener noreferrer">
          View profile
        </Card.Link>
      </Card.Body>
    </Card>
  );
};

export default TweetCard;
