export interface AuthStateProps {
  isAuthInProgress: boolean;
  username: string;
  userId: string;
  token: string;
  tokenSecret: string;
  isLoggedIn: boolean;
  readonly socket: SocketIOClient.Socket;
}

export interface AuthAction {
  type: 'AUTH';
  payload: Partial<AuthStateProps>
}