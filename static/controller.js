// TODO: Add toast messages
// TODO: Add a conformation for starting / stopping the stream with sockets (using toasts!!!)
// TODO: Add a limit to the number of cards that can appear on the screen
// TODO: Give an indication of when the stream is stopped or running

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
  const $loadingOverlay = $('#overlay-loading');

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

      $.post({
        url: url + '/login',
        headers: payload
      }).done(() => {
        Cookies.set('username', username);
        enableNavButtons();

        $logoutBtn.removeAttr('disabled');
        $loadingOverlay.toggle();
        $(this).attr('disabled', 'disabled');

      }).fail((error) => {
        console.log('An error occurred completing request', error);
      });

    }).catch((error) => {
      console.table(error);
      $loadingOverlay.toggle();
      $(this).removeAttr('disabled');
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
    'trigger': 'hover',
    'title': 'Separate multiple words with commas',
  }).focus(function () {
    $(this).tooltip('hide')
  });

  // Add the tweet to the flex-container
  socket.on('tweet', function (tweet, callback) {
    // Invoke the callback to tell the server that this tweet was received
    callback();

    // This is the created HTML element:
    //
    // <div class="card shadow rounded">
    //   <div>
    //     <div class="card-body">
    //       <h5 class="card-title">@ctcuff</h5>
    //       <h6 class="card-subtitle mb-2 text-muted">May, 08 2019 - 05:13:15 PM</h6>
    //       <p class="card-text">Hello, World!</p>
    //     </div>
    //   </div>
    //   <a href="https://twitter.com/ctcuff" target="_blank" class="card-link">View profile</a>
    // </div>

    const $cardContainer = $("<div class='card shadow rounded'></div>");
    const $contentWrapper = $("<div></div>");
    const $cardBody = $("<div class='card-body'></div>");
    const $cardTitle = $(`<h5 class='card-title'>@${tweet.screen_name}</h5>`);
    const $cardSubtitle = $(`<h6 class="card-subtitle mb-2 text-muted">${tweet.created_at}</h6>`);
    const $cardText = $(`<p class="card-text">${tweet.text}</p>`);
    const $cardLink = $(`<a href="${tweet.profile_url}" target="_blank" class="card-link">View profile</a>`);

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
