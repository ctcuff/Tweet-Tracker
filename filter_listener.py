from tweepy import StreamListener


class FilterListener(StreamListener):
    def __init__(self, status_callback, on_connect_callback):
        super().__init__()
        self._status_callback = status_callback
        self._on_connect_callback = on_connect_callback

    def on_status(self, status):
        self._status_callback(status)

    def on_connect(self):
        self._on_connect_callback()
        print('Stream connected')

    def on_warning(self, notice):
        print(f'On warning: {notice}')

    def on_error(self, status_code):
        print(f'Error: {status_code}')
