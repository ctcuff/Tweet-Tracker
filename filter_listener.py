from tweepy import StreamListener


class FilterListener(StreamListener):
    def __init__(self, callback):
        super().__init__()
        self.callback = callback

    def on_status(self, status):
        self.callback(status)

    def on_connect(self):
        print('Stream connected')

    def on_error(self, status_code):
        print(status_code)
