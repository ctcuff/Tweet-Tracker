class User:
    def __init__(self, id, username, stream):
        self.id = id
        self.username = username
        self.stream = stream
        self.messages_received = 0
        self.messages_sent = 0
