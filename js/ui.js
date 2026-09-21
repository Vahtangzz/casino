/* ===== UI — shared header, toasts, modals, settings application ===== */
const SGPUI = (() => {
  const inGamesDir = location.pathname.replace(/\\/g, '/').includes('/games/');
  const BASE = inGamesDir ? '../' : '';

  function applySettings(settings) {
    const html = document.documentElement;
    html.classList.remove('perf-low', 'perf-medium', 'perf-high');
    html.classList.add('perf-' + (settings.performanceMode || 'medium'));
    html.classList.toggle('school-mode', !!settings.schoolMode);
    html.setAttribute('data-theme-color', settings.theme || 'default');
  }

  function activeSettings() {
    const acc = SGP.getCurrentAccount();
    if (acc) return acc.settings;
    return SGP.defaultAccount('guest').settings;
  }

  function initSettings() { applySettings(activeSettings()); }

  function toast(msg, type = '') {
    let root = document.getElementById('toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toast-root';
      document.body.appendChild(root);
    }
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function levelForXP(xp) {
    // level up every 500xp * level (gentle ramp)
    let level = 1, need = 500, remaining = xp;
    while (remaining >= need) { remaining -= need; level++; need = 500 * level; }
    return { level, into: remaining, need };
  }

  function grantXPAndCoins(xpGain, coinGain) {
    return SGP.updateCurrentAccount(acc => {
      acc.xp += xpGain;
      acc.coins = Math.max(0, acc.coins + coinGain);
      const lv = levelForXP(acc.xp);
      const leveledUp = lv.level > acc.level;
      acc.level = lv.level;
      if (leveledUp) toast('🎉 Level up! You reached level ' + lv.level, 'gold');
    });
  }

  function renderHeader(activeId) {
    const mount = document.getElementById('app-header');
    if (!mount) return;
    const acc = SGP.getCurrentAccount();
    const guest = SGP.isGuestMode();
    const homeHref = BASE + 'index.html';
    const profileHref = BASE + 'profile.html';

    let right = '';
    if (acc) {
      right = `
        <div class="hdr-stat" title="Coins">🪙 ${acc.coins.toLocaleString()}</div>
        <div class="hdr-stat" title="Level">⭐ Lv.${acc.level}</div>
        <div class="hdr-user" id="hdrUserBtn"><span class="av ${SGPCosmetics.frameById(acc.frame).css || ''}">${acc.avatar}</span><span>${escapeHtml(acc.username)}</span></div>
      `;
    } else if (guest) {
      right = `<span class="faint" style="font-size:12px">Playing as guest</span><button class="hdr-btn primary" id="hdrLoginBtn">Sign Up / Log In</button>`;
    } else {
      right = `<button class="hdr-btn primary" id="hdrLoginBtn">Sign Up / Log In</button>`;
    }

    mount.innerHTML = `
      <div class="container hdr-inner">
        <a class="hdr-logo" href="${homeHref}"><span class="mark">🎮</span> School Games Portal</a>
        <nav class="hdr-nav">
          <a href="${homeHref}" class="${activeId === 'home' ? 'active' : ''}">Home</a>
          <a href="${profileHref}" class="${activeId === 'profile' ? 'active' : ''}">Profile</a>
        </nav>
        <div class="hdr-spacer"></div>
        ${right}
      </div>`;

    const loginBtn = document.getElementById('hdrLoginBtn');
    if (loginBtn) loginBtn.addEventListener('click', () => openAuthModal());
    const userBtn = document.getElementById('hdrUserBtn');
    if (userBtn) userBtn.addEventListener('click', () => location.href = profileHref);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function openModal(innerHtml) {
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${innerHtml}</div>`;
    back.addEventListener('click', e => { if (e.target === back) back.remove(); });
    document.body.appendChild(back);
    return back;
  }

  function openAuthModal(tab = 'login') {
    const back = openModal(`
      <div class="tabs">
        <button data-tab="login" class="${tab === 'login' ? 'active' : ''}">Log In</button>
        <button data-tab="signup" class="${tab === 'signup' ? 'active' : ''}">Sign Up</button>
      </div>
      <div id="authTabBody"></div>
      <p class="form-hint" style="margin-top:14px">Accounts are saved locally in this browser only — not in the cloud. Use <b>Export Save</b> from your profile to move an account to another computer.</p>
      <button class="btn ghost block" id="guestBtn" style="margin-top:8px">Continue as Guest</button>
    `);
    const body = back.querySelector('#authTabBody');
    function renderTab(which) {
      back.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === which));
      if (which === 'login') {
        body.innerHTML = `
          <div class="field"><label for="liUser">Username</label><input id="liUser" type="text" autocomplete="username"></div>
          <div class="field"><label for="liPass">Password</label><input id="liPass" type="password" autocomplete="current-password"></div>
          <div class="form-error" id="liErr"></div>
          <button class="btn primary block" id="liSubmit">Log In</button>`;
        body.querySelector('#liSubmit').addEventListener('click', async () => {
          const u = body.querySelector('#liUser').value, p = body.querySelector('#liPass').value;
          try { await SGPAuth.logIn(u, p); location.reload(); }
          catch (e) { body.querySelector('#liErr').textContent = e.message; }
        });
      } else {
        body.innerHTML = `
          <div class="field"><label for="suUser">Username</label><input id="suUser" type="text" autocomplete="username" maxlength="16"></div>
          <div class="field"><label for="suPass">Password</label><input id="suPass" type="password" autocomplete="new-password"></div>
          <div class="form-error" id="suErr"></div>
          <button class="btn primary block" id="suSubmit">Create Account</button>`;
        body.querySelector('#suSubmit').addEventListener('click', async () => {
          const u = body.querySelector('#suUser').value, p = body.querySelector('#suPass').value;
          try { await SGPAuth.signUp(u, p); location.reload(); }
          catch (e) { body.querySelector('#suErr').textContent = e.message; }
        });
      }
    }
    back.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => renderTab(b.dataset.tab)));
    back.querySelector('#guestBtn').addEventListener('click', () => { SGPAuth.playAsGuest(); location.reload(); });
    renderTab(tab);
    return back;
  }

  function fmt(n) { return Math.round(n).toLocaleString(); }

  return { BASE, applySettings, activeSettings, initSettings, toast, levelForXP, grantXPAndCoins, renderHeader, openModal, openAuthModal, escapeHtml, fmt };
})();

document.addEventListener('DOMContentLoaded', () => { SGPUI.initSettings(); });
