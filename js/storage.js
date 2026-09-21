/* ===== Storage — local account system (Option A: browser-local, no server) =====
   Everything here lives in localStorage on THIS browser/device only.
   Data model:
     sgp_accounts_v1 : { [usernameLower]: Account }
     sgp_session_v1  : { username } | null
   Account:
     { username, salt, hash, createdAt, avatar, coins, xp, level,
       gamesPlayed, wins, achievements:[id], favorites:[gameId],
       highScores:{ [gameId]: number }, stats:{ [gameId]: {plays,best,last} },
       settings:{ sound, music, schoolMode, performanceMode, reduceMotion } }
*/
const SGP = (() => {
  const ACC_KEY = 'sgp_accounts_v1';
  const SESSION_KEY = 'sgp_session_v1';
  const GUEST_KEY = 'sgp_guest_v1';

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { console.warn('SGP storage write failed', e); return false; }
  }

  function defaultAccount(username) {
    return {
      username,
      salt: null, hash: null, createdAt: Date.now(),
      avatar: '🙂',
      coins: 500, xp: 0, level: 1,
      gamesPlayed: 0, wins: 0,
      achievements: [],
      favorites: [],
      highScores: {},
      stats: {},
      settings: { sound: true, music: true, schoolMode: false, performanceMode: 'medium' }
    };
  }

  function getAccounts() { return readJSON(ACC_KEY, {}); }
  function saveAccounts(accs) { return writeJSON(ACC_KEY, accs); }

  function getSession() { return readJSON(SESSION_KEY, null); }
  function setSession(username) { writeJSON(SESSION_KEY, username ? { username } : null); }

  function isGuestMode() { return readJSON(GUEST_KEY, false) === true; }
  function setGuestMode(on) { writeJSON(GUEST_KEY, !!on); }

  function currentUsername() {
    const s = getSession();
    return s ? s.username : null;
  }

  function getCurrentAccount() {
    const uname = currentUsername();
    if (!uname) return null;
    const accs = getAccounts();
    return accs[uname.toLowerCase()] || null;
  }

  function updateCurrentAccount(mutatorFn) {
    const uname = currentUsername();
    if (!uname) return null;
    const accs = getAccounts();
    const key = uname.toLowerCase();
    if (!accs[key]) return null;
    mutatorFn(accs[key]);
    saveAccounts(accs);
    return accs[key];
  }

  function usernameTaken(username) {
    const accs = getAccounts();
    return !!accs[username.toLowerCase()];
  }

  function createAccount(username, account) {
    const accs = getAccounts();
    accs[username.toLowerCase()] = account;
    saveAccounts(accs);
  }

  function deleteAccount(username) {
    const accs = getAccounts();
    delete accs[username.toLowerCase()];
    saveAccounts(accs);
    if (currentUsername() && currentUsername().toLowerCase() === username.toLowerCase()) {
      setSession(null);
    }
  }

  function exportSave() {
    const acc = getCurrentAccount();
    if (!acc) return null;
    const blob = { format: 'sgp-save', version: 1, exportedAt: Date.now(), account: acc };
    return blob;
  }

  function importSave(blob) {
    if (!blob || blob.format !== 'sgp-save' || !blob.account || !blob.account.username) {
      throw new Error('That file is not a valid save export.');
    }
    const acc = blob.account;
    // merge in any missing default fields so older exports still work
    const merged = Object.assign(defaultAccount(acc.username), acc);
    createAccount(acc.username, merged);
    setSession(acc.username);
    setGuestMode(false);
    return merged;
  }

  function renameCurrentAccount(newUsername) {
    const uname = currentUsername();
    if (!uname) throw new Error('Not logged in');
    if (usernameTaken(newUsername) && newUsername.toLowerCase() !== uname.toLowerCase()) {
      throw new Error('That username is already taken on this browser');
    }
    const accs = getAccounts();
    const acc = accs[uname.toLowerCase()];
    delete accs[uname.toLowerCase()];
    acc.username = newUsername;
    accs[newUsername.toLowerCase()] = acc;
    saveAccounts(accs);
    setSession(newUsername);
    return acc;
  }

  function resetCurrentAccount() {
    const uname = currentUsername();
    if (!uname) return;
    deleteAccount(uname);
  }

  return {
    ACC_KEY, SESSION_KEY,
    defaultAccount, getAccounts, saveAccounts,
    getSession, setSession, isGuestMode, setGuestMode,
    currentUsername, getCurrentAccount, updateCurrentAccount,
    usernameTaken, createAccount, deleteAccount, renameCurrentAccount,
    exportSave, importSave, resetCurrentAccount
  };
})();
