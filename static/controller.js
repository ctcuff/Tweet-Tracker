// TODO: Add loading screen when authentication is in progress
// TODO: Add toast messages
// TODO: Fix scrolling (the page should auto scroll when a tweet comes in)
// TODO: Add a conformation for starting / stopping the stream with sockets (using toasts!!!)
// TODO: Add a limit to the number of cards that can appear on the screen

$(document).ready(() => {
  const url = location.protocol + '//' + document.domain + ':' + location.port;
  const socket = io.connect(url);
  const provider = new firebase.auth.TwitterAuthProvider();
  const $keywordInput = $('#input-keyword');
  const $flexContainer = $('.flex-container');
  const $loginBtn = $('#btn-login');
  const $logoutBtn = $('#btn-logout');
  const $formBtnContainer = $('#form-btn-container');
  const $occurrences = $('#occurrences');

  let numOccurrences = 0;
  let isAtBottom = false;

  window.onscroll = () => {
    isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;
  };

  // The user is already logged in every nav button except
  // the login button
  if (Cookies.get('username') !== undefined) {
    enableNavButtons();
  }

  $('#btn-stop').click(() => socket.emit('stop stream'));
  $('#fab-up').click(() => window.scrollTo(0, 0));
  $('#fab-down').click(() => window.scrollTo(0, document.body.scrollHeight));
  $('#btn-clear').click(() => $flexContainer.empty());
  $('#btn-start').click(() => {
    if ($keywordInput.val() === '') {
      console.log('No keyword was entered');
      return;
    }
    const keywords = $keywordInput
        .val()
        .split(',')
        .map(str => str.trim());

    socket.emit('start stream', { 'keywords': keywords });
  });

  $loginBtn.click(function () {
    // Disable the login button so it can't be clicked
    // while a login is already in progress
    $(this).attr('disabled', 'disabled');

    // This gives the Twitter OAuth 1.0 Access Token and Secret.
    firebase.auth().signInWithPopup(provider).then((result) => {
      console.log(result);
      const username = result.additionalUserInfo.username;
      const payload = {
        'username': username,
        'access_token': result.credential.accessToken,
        'access_token_secret': result.credential.secret
      };

      $.post({
        url: url + '/login',
        headers: payload
      }).done(() => {
        Cookies.set('username', username);
        enableNavButtons();
        $logoutBtn.removeAttr('disabled');
        $(this).attr('disabled', 'disabled');
      }).fail((error) => {
        console.log('An error occurred completing request', error);
      });

    }).catch((error) => {
      console.table(error);
      $(this).removeAttr('disabled');
    });
  });

  $logoutBtn.click(() => {
    // Make sure the server knows to stop the stream if the
    // user doesn't stop is before they log out
    socket.emit('stop stream');

    // Disable every button except for the login button
    for (const child of $formBtnContainer.children()) {
      if ($(child).attr('id') !== $loginBtn.attr('id')) {
        $(child).attr('disabled', 'disabled');
      }
    }
    $logoutBtn.attr('disabled', 'disabled');
    Cookies.remove('username');
    $('#form-logout').submit();
  });

  // Show the tooltip on hover but hide it when the
  // input has gained focus
  $keywordInput.tooltip({
    'trigger': 'hover',
    'title': 'Separate multiple words with commas',
  }).focus(() => $keywordInput.tooltip('hide'));

  // Add the tweet to the flex-container
  socket.on('tweet', (tweet) => {
    socket.emit('tweet received');
    console.log(tweet);

    const $cardContainer = $("<div class='card shadow rounded'></div>");
    const $contentWrapper = $("<div></div>");
    const $cardBody = $("<div class='card-body'></div>");
    const $cardTitle = $(`<h5 class='card-title' id='tweet-username'>@${tweet.screen_name}</h5>`);
    const $cardSubtitle = $(`<h6 class="card-subtitle mb-2 text-muted" id="tweet-date">${tweet.created_at}</h6>`);
    const $cardText = $(`<p class="card-text" id="tweet-text">${tweet.text}</p>`);
    const $cardLink = $(`<a href="${tweet.profile_url}" target="_blank" class="card-link" id="tweet-profile-link">View profile</a>`);

    $cardBody.append($cardTitle);
    $cardBody.append($cardSubtitle);
    $cardBody.append($cardText);

    $contentWrapper.append($cardBody);

    $cardContainer.append($contentWrapper);
    $cardContainer.append($cardLink);

    $flexContainer.append($cardContainer);
    $occurrences.text(++numOccurrences);

    $contentWrapper.click(() => {
      const win = window.open(tweet.tweet_url, '_blank');
      // Make sure the browser can actually open new windows
      if (win !== null) {
        win.focus();
      }
    });

    // Auto scroll to the bottom but only if the page is
    // already at the bottom
    if (isAtBottom) {
      window.scrollTo(0, document.body.scrollHeight);
    }
  });

  // Disable every nav button except for the login button
  function enableNavButtons() {
    for (const child of $formBtnContainer.children()) {
      $(child).removeAttr('disabled');
    }
    $loginBtn.attr('disabled', 'disabled');
    $logoutBtn.removeAttr('disabled');
  }
});
