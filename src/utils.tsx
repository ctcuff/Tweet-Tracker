function setCookie(name: string, value: string): string {
  const date = new Date();
  date.setTime(date.getTime() + 86400000000);
  const expires = 'expires=' + date.toUTCString();
  document.cookie = name + '=' + value + ';' + expires + ';path=/';
  return value;
}

function getCookie(cookieName: string): string {
  const name = cookieName + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const parts = decodedCookie.split(';');
  for (let i = 0; i < parts.length; i++) {
    let c = parts[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

function deleteCookie(name: string): string {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  return '';
}

export { setCookie, getCookie, deleteCookie }