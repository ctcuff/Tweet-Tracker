class User:
    def __init__(self, username, stream):
        self.username = username
        self.stream = stream
        self.messages_received = 0
        self.messages_sent = 0
