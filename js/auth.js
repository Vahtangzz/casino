/* ===== Auth — client-side password hashing (PBKDF2/SHA-256 via WebCrypto) =====
   NOTE: This is a LOCAL account system. There is no server, so "secure" here means
   "not stored in plain text on this device" — it does not protect against someone
   with access to this browser profile. Clearly disclosed to users in the UI. */
const SGPAuth = (() => {
  const ITERATIONS = 120000;

  function randomSaltHex(len = 16) {
    const bytes = crypto.getRandomValues(new Uint8Array(len));
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function hexToBytes(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  async function deriveHash(password, saltHex) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: hexToBytes(saltHex), iterations: ITERATIONS, hash: 'SHA-256' },
      keyMaterial, 256
    );
    return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function validUsername(u) {
    return /^[A-Za-z0-9_]{3,16}$/.test(u || '');
  }
  function validPassword(p) {
    return typeof p === 'string' && p.length >= 4;
  }

  async function signUp(username, password) {
    username = (username || '').trim();
    if (!validUsername(username)) throw new Error('Username must be 3-16 letters, numbers or _');
    if (!validPassword(password)) throw new Error('Password must be at least 4 characters');
    if (SGP.usernameTaken(username)) throw new Error('That username is already taken on this browser');

    const salt = randomSaltHex();
    const hash = await deriveHash(password, salt);
    const account = SGP.defaultAccount(username);
    account.salt = salt;
    account.hash = hash;
    SGP.createAccount(username, account);
    SGP.setSession(username);
    SGP.setGuestMode(false);
    return account;
  }

  async function logIn(username, password) {
    username = (username || '').trim();
    const accs = SGP.getAccounts();
    const acc = accs[username.toLowerCase()];
    if (!acc) throw new Error('No account with that username on this browser');
    const hash = await deriveHash(password, acc.salt);
    if (hash !== acc.hash) throw new Error('Incorrect password');
    SGP.setSession(acc.username);
    SGP.setGuestMode(false);
    return acc;
  }

  function logOut() {
    SGP.setSession(null);
    SGP.setGuestMode(false);
  }

  function playAsGuest() {
    SGP.setSession(null);
    SGP.setGuestMode(true);
  }

  async function changePassword(oldPassword, newPassword) {
    const acc = SGP.getCurrentAccount();
    if (!acc) throw new Error('Not logged in');
    const oldHash = await deriveHash(oldPassword, acc.salt);
    if (oldHash !== acc.hash) throw new Error('Current password is incorrect');
    if (!validPassword(newPassword)) throw new Error('New password must be at least 4 characters');
    const salt = randomSaltHex();
    const hash = await deriveHash(newPassword, salt);
    SGP.updateCurrentAccount(a => { a.salt = salt; a.hash = hash; });
  }

  return { signUp, logIn, logOut, playAsGuest, changePassword, validUsername, validPassword };
})();
