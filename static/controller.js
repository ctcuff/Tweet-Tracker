$(document).ready(() => {
  const rootUrl = location.protocol + '//' + document.domain + ':' + location.port;
  const socket = io.connect(rootUrl);
  const provider = new firebase.auth.TwitterAuthProvider();
  const $keywordInput = $('#input-keyword');
  const $flexContainer = $('.container-fluid');
  const $loginBtn = $('#btn-login');
  const $logoutBtn = $('#btn-logout');
  const $formBtnContainer = $('#form-btn-container');
  const $occurrences = $('#occurrences');
  const $loadingOverlay = $('#overlay-loading');
  const $circleIndicator = $('.circle');

  let numOccurrences = 0;
  let isAtBottom = false;
  let isStreamRunning = false;

  window.onscroll = () => {
    isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;
  };

  $(document).keypress((e) => {
    if (Cookies.get('username') === undefined) {
      return;
    }

    if (e.key === 'Enter' && $keywordInput.val().trim().length > 0) {
      socket.emit('start stream', { 'keywords': getKeyWords() });
    }
  });

  // The user is already logged in so disable
  // every nav button except the login button
  if (Cookies.get('username') !== undefined) {
    enableNavButtons();
  }

  // Ask the server if a stream is already running
  $.get(rootUrl + '/status', (res) => {
    isStreamRunning = res.running;
    console.log(res);
    toggleIndicator();
    $loadingOverlay.toggle();
  });

  $('#fab-up').click(() => window.scrollTo(0, 0));
  $('#fab-down').click(() => window.scrollTo(0, document.body.scrollHeight));
  $('#btn-clear').click(() => $flexContainer.empty());
  $('#btn-start').click(() => {
    if ($keywordInput.val().trim().length === 0) {
      toastr.error("You need to enter a keyword");
      return;
    }
    socket.emit('start stream', { 'keywords': getKeyWords() });
  });
  $('#btn-stop').click(() => {
    isStreamRunning = false;
    toggleIndicator();
    socket.emit('stop stream');
  });

  $loginBtn.click(function () {
    // Disable the login button so it can't be clicked
    // while a login is already in progress
    $(this).attr('disabled', 'disabled');

    $loadingOverlay.toggle();

    // This gives the Twitter OAuth 1.0 Access Token and Secret.
    firebase.auth().signInWithPopup(provider).then((result) => {
      console.log(result);
      const username = result.additionalUserInfo.username;
      const payload = {
        'username': username,
        'access_token': result.credential.accessToken,
        'access_token_secret': result.credential.secret
      };

      const data = {
        url: rootUrl + '/login',
        headers: payload
      };

      $.post(data, () => {
        Cookies.set('username', username);
        enableNavButtons();

        $logoutBtn.removeAttr('disabled');

        $(this).attr('disabled', 'disabled');

        toastr.success(`Hello @${username}`, "Welcome");
      }).fail((error) => {
        console.log('An error occurred completing request', error);
      }).always(() => $loadingOverlay.toggle());

    }).catch((error) => {
      console.table(error);
      $loadingOverlay.toggle();
      $(this).removeAttr('disabled');
      toastr.error("An error occurred while logging in, please try again", "Error");
    });
  });

  $logoutBtn.click(function () {
    // Make sure the server knows to stop the stream if the
    // user doesn't stop is before they log out
    socket.emit('stop stream');
    $loadingOverlay.toggle();
    $(this).attr('disabled', 'disabled');
    Cookies.remove('username');
    $('#form-logout').submit();
  });

  // Show the tooltip on hover but hide it when the
  // input has gained focus
  $keywordInput.tooltip({
    trigger: 'hover',
    title: 'Separate multiple words with commas',
  }).focus(function () {
    $(this).tooltip('hide');
  });

  $circleIndicator.tooltip({ trigger: 'hover' });

  socket.on('stream connected', () => {
    isStreamRunning = true;
    toggleIndicator();
    toastr.success(`Listening for: ${getKeyWords().join(', ')}`, 'Connected');
  });

  // Add the tweet to the flex-container
  socket.on('tweet', function (tweet, callback) {
    // Invoke the callback to tell the server that this tweet was received
    callback();

    // This is the created HTML element:
    //
    // <div class="card card-body rounded">
    //   <h5 class="card-title">@ctcuff</h5>
    //   <h6 class="card-subtitle mb-2 text-muted">May, 08 2019 - 05:13:15 PM</h6>
    //   <p class="card-text">Hello, World!</p>
    //   <a href="https://twitter.com/ctcuff" target="_blank" class="card-link">View profile</a>
    // </div>

    const $cardBody = $('<div class="card card-body rounded"></div>');
    const $cardTitle = $(`<h5 class="card-title">@${tweet.screen_name}</h5>`);
    const $cardSubtitle = $(`<h6 class="card-subtitle mb-2 text-muted">${tweet.created_at}</h6>`);
    const $cardText = $(`<p class="card-text">${tweet.text}</p>`);
    const $cardLink = $(`<a href="${tweet.profile_url}" target="_blank" class="card-link">View profile</a>`);

    $cardBody.append($cardTitle);
    $cardBody.append($cardSubtitle);
    $cardBody.append($cardText);
    $cardBody.append($cardLink);

    $flexContainer.append($cardBody);
    $occurrences.text(++numOccurrences);

    $cardBody.click((event) => {
      // Don't let the <a> tag trigger this click listener
      if ($(event.target).is('a')) {
        return;
      }
      const win = window.open(tweet.tweet_url, '_blank');
      // Make sure the browser can actually open new windows
      if (win !== null) {
        win.focus();
      }
    });

    if (isAtBottom) {
      window.scrollTo(0, document.body.scrollHeight);
    }
  });

  // Enable every nav button except for the logout button
  function enableNavButtons() {
    for (const child of $formBtnContainer.children()) {
      $(child).removeAttr('disabled');
    }
    $loginBtn.attr('disabled', 'disabled');
    $logoutBtn.removeAttr('disabled');
  }

  function getKeyWords() {
    return $keywordInput
        .val()
        .split(',')
        .map(str => str.trim())
        .filter(str => str.length > 0);
  }

  function toggleIndicator() {
    $circleIndicator.css({ 'background-color': isStreamRunning ? '#009300' : '#cb0021' });
    $circleIndicator.attr('data-original-title', isStreamRunning ? 'Stream is running' : 'Stream is not running');
  }
});
