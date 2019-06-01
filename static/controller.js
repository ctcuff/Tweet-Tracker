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
      stopStream();
    }
  });

  if (Cookies.get('at') !== undefined && Cookies.get('ats') !== undefined) {
    enableNavButtons();
    showUsername();

    const payload = {
      url: '/status',
      headers: {
        id: Cookies.get('id')
      }
    };

    // Ask the server if a stream is already running
    $.get(payload, (res) => {
      isStreamRunning = res.running;
      console.log(res);
      toggleIndicator();
      $loadingOverlay.toggle();
    });
  } else {
    $loadingOverlay.toggle();
  }

  $('#fab-up').click(() => window.scrollTo(0, 0));
  $('#fab-down').click(() => window.scrollTo(0, document.body.scrollHeight));
  $('#btn-start').click(() => startStream());

  $('#btn-clear').click(() => {
    $flexContainer.empty();
    numOccurrences = 0;
    $occurrences.text(numOccurrences);
  });

  $('#btn-stop').click(() => stopStream());

  $loginBtn.click(function () {
    // Disable the login button so it can't be clicked
    // while a login is already in progress
    $(this).attr('disabled', 'disabled');

    $loadingOverlay.toggle();

    firebase.auth().signInWithPopup(provider).then((result) => {
      const id  = result.additionalUserInfo.profile.id_str;
      const username = result.additionalUserInfo.username;
      const { accessToken, secret } = result.credential;
      const payload = {
        url: '/login',
        headers: {
          'username': username,
          'access_token': accessToken,
          'access_token_secret': secret,
          'id': id
        }
      };

      Cookies.set('username', username);
      Cookies.set('at', accessToken);
      Cookies.set('ats', secret);
      Cookies.set('id', id);

      $.post(payload, () => {
        console.log(payload);

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

  socket.on('stream connected', (data) => {
    if (data.id !== Cookies.get('id'))
      return;
    isStreamRunning = true;
    toggleIndicator();
    toastr.success(`Listening for: ${getKeyWords().join(', ')}`, 'Connected');
  });

  socket.on('stream disconnected', (data) => {
    if (data.id !== Cookies.get('id'))
      return;
    isStreamRunning = false;
    toggleIndicator();
    toastr.error('Stream disconnected');
  });

  // Add the tweet to the flex-container
  socket.on('tweet', function (data, callback) {
    const tweet = data.tweet;

    if (data.id !== Cookies.get('id'))
      return;

    // Invoke the callback to tell the server that this tweet was received
    callback(data.id);

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
      keywords: getKeyWords(),
      access_token: Cookies.get('at'),
      access_token_secret: Cookies.get('ats'),
      id: Cookies.get('id')
    });
  }

  function stopStream() {
    isStreamRunning = false;
    toggleIndicator();
    socket.emit('stop stream', { id: Cookies.get('id') });
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
    const payload = {
      url: '/get_username',
      headers: {
        access_token: Cookies.get('at'),
        access_token_secret: Cookies.get('ats'),
        id: Cookies.get('id')
      }
    };

    // Ask the server for the user's username in case
    // they've changed it
    $.get(payload, (res) => {
      $displayUsername
          .css({ display: 'block' })
          .find('a')
          .attr('href', `https://twitter.com/${res.username}`)
          .text(`@${res.username}`);
    });
  }
});
