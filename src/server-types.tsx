// Contains interfaces that correspond to the
// responses returned by the server and emitted
// by the server socket

export interface ServerTweet {
  user_id?: string;
  tweet: {
    created_at: string;
    status_id: string;
    text: string;
    screen_name: string;
    tweet_url: string;
    profile_url: string;
  };
}

export interface ServerConnectResponse {
  user_id: string;
}

export interface ServerResponse {
  data: {
    running: boolean;
  };
}

export interface ServerHeaders {
  user_id: string;
  access_token?: string;
  access_token_secret?: string;
}

export interface SocketResponse {
  user_id: string;
}
