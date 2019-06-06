from tweepy import StreamListener


class FilterListener(StreamListener):
    def __init__(self, user_id, status_callback, on_connect_callback):
        super().__init__()
        self._status_callback = status_callback
        self._on_connect_callback = on_connect_callback
        self._user_id = user_id

    def on_status(self, status):
        self._status_callback(self._user_id, status)

    def on_connect(self):
        self._on_connect_callback(self._user_id)
        print('Stream connected')

    def on_warning(self, notice):
        print(f'On warning: {notice}')

    def on_error(self, status_code):
        print(f'Error: {status_code}')

    def on_exception(self, exception):
        print('An exception occurred')
