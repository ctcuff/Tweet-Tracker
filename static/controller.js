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
  const $displayUsername = $('.display-username');

  let numOccurrences = 0;
  let isAtBottom = false;
  let isStreamRunning = false;

  window.onscroll = () => {
    isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;
  };

  $(document).keydown((e) => {
    if (Cookies.get('at') === undefined || Cookies.get('ats') === undefined) {
      return;
    }

    if (e.key === 'Enter') {
      startStream();
    }

    if (e.key === 'Escape') {
      socket.emit('stop stream');
    }
  });

  if (Cookies.get('at') !== undefined || Cookies.get('ats') !== undefined) {
    enableNavButtons();
    showUsername();
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
  $('#btn-start').click(() => startStream());

  $('#btn-clear').click(() => {
    $flexContainer.empty();
    numOccurrences = 0;
    $occurrences.text(numOccurrences);
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
        Cookies.set('at', payload.access_token);
        Cookies.set('ats', payload.access_token_secret);
        Cookies.set('id', payload.access_token.split('-')[0]);

        enableNavButtons();
        showUsername();
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
    $loadingOverlay.toggle();
    $(this).attr('disabled', 'disabled');

    Cookies.remove('username');
    Cookies.remove('at');
    Cookies.remove('ats');
    Cookies.remove('id');

    $('#form-logout').submit();
    $displayUsername.css({ display: 'none' });
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

  socket.on('stream disconnected', () => {
    isStreamRunning = false;
    toggleIndicator();
    toastr.error('Stream disconnected');
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

    $cardBody.append($cardTitle, $cardSubtitle, $cardText, $cardLink);

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

  function startStream() {
    if (isStreamRunning) {
      toastr.error('A stream is already running');
      return;
    }

    if ($keywordInput.val().trim().length === 0) {
      toastr.error('You need to enter a keyword');
      return;
    }

    $circleIndicator
        .css({ 'background-color': '#fce51d' })
        .attr('data-original-title', 'Stream is starting');

    socket.emit('start stream', {
      'keywords': getKeyWords(),
      'access_token': Cookies.get('at'),
      'access_token_secret': Cookies.get('ats')
    });
  }

  // Enable every nav button except for the logout button
  function enableNavButtons() {
    $formBtnContainer.children().each(function () {
      $(this).removeAttr('disabled');
    });
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
    $circleIndicator
        .css({ 'background-color': isStreamRunning ? '#009300' : '#cb0021' })
        .attr('data-original-title', isStreamRunning ? 'Stream is running' : 'Stream is not running');
  }

  function showUsername() {
    const data = {
      url: rootUrl + '/get_username',
      headers: {
        access_token: Cookies.get('at'),
        access_token_secret: Cookies.get('ats')
      }
    };

    // Ask the server for the user's username in case
    // they've changed it while logged in
    $.get(data, (res) => {
      $displayUsername
          .css({ display: 'block' })
          .find('a')
          .attr('href', `https://twitter.com/${res.username}`)
          .text(`@${res.username}`);
    });
  }
});
