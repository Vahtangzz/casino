(() => {
  const root = document.getElementById('profileRoot');
  const AVATARS = ['🙂','😎','🤖','🐱','🐶','🦊','🐼','🐸','🦄','👾','🎮','🧑‍🚀','🧙','🥷','🐯','🐲'];
  const RANKS = [[1,'Rookie'],[5,'Regular'],[10,'Skilled'],[15,'Veteran'],[20,'Expert'],[25,'Elite'],[35,'Master'],[50,'Legend']];
  function rankTitle(level) {
    let t = RANKS[0][1];
    for (const [lvl, name] of RANKS) if (level >= lvl) t = name;
    return t;
  }

  function getGuestAcc() {
    return JSON.parse(sessionStorage.getItem('sgp_guest_account_v1') || 'null');
  }

  function renderSignedOut() {
    root.innerHTML = `
      <div class="card" style="text-align:center;padding:34px 20px">
        <div style="font-size:38px">🔒</div>
        <h2>You're not signed in</h2>
        <p class="muted">Create a free local account to track XP, coins, achievements and high scores across visits — or continue as a guest to play without saving.</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px">
          <button class="btn primary" id="psSignup">Sign Up / Log In</button>
          <button class="btn ghost" id="psGuest">Continue as Guest</button>
        </div>
      </div>`;
    root.querySelector('#psSignup').addEventListener('click', () => SGPUI.openAuthModal());
    root.querySelector('#psGuest').addEventListener('click', () => { SGP.setGuestMode(true); location.reload(); });
  }

  function xpBar(acc) {
    const lv = SGPUI.levelForXP(acc.xp);
    const pct = Math.min(100, Math.round((lv.into / lv.need) * 100));
    return `<div class="xp-bar-wrap"><div class="xp-bar"><div class="xp-bar-fill" style="width:${pct}%"></div></div>
      <div class="faint" style="margin-top:5px;font-size:11.5px">XP ${lv.into.toLocaleString()} / ${lv.need.toLocaleString()} to next level</div></div>`;
  }

  function statGrid(acc) {
    const achvCount = (acc.achievements || []).length;
    const hsCount = Object.keys(acc.highScores || {}).length;
    const tiles = [
      ['🪙', acc.coins.toLocaleString(), 'Coins'],
      ['🎮', (acc.gamesPlayed || 0).toLocaleString(), 'Games Played'],
      ['🏆', achvCount + ' / ' + SGPAchievements.LIST.length, 'Achievements'],
      ['⭐', hsCount, 'High Scores'],
      ['❤️', (acc.favorites || []).length, 'Favorites'],
      ['🥇', acc.wins || 0, 'Wins'],
    ];
    return `<div class="stat-grid">${tiles.map(t => `<div class="stat-tile"><div class="n">${t[0]} ${t[1]}</div><div class="l">${t[2]}</div></div>`).join('')}</div>`;
  }

  function achievementsHtml(acc) {
    const have = new Set(acc.achievements || []);
    return `<div class="achv-grid">${SGPAchievements.LIST.map(a => `
      <div class="achv ${have.has(a.id) ? 'unlocked' : ''}">
        <div class="ic">${a.ic}</div>
        <div><div class="t">${a.t}</div><div class="d">${a.d}</div></div>
      </div>`).join('')}</div>`;
  }

  function favoritesHtml(acc) {
    const favs = (acc.favorites || []).map(id => sgpGameById(id)).filter(Boolean);
    if (!favs.length) return `<p class="faint">No favorites yet. Tap the ☆ on any game to add it here.</p>`;
    return `<div class="game-grid">${favs.map(g => `
      <a class="game-card" href="${g.path}">
        <div class="thumb">${g.icon}</div><div class="gname">${g.name}</div>
      </a>`).join('')}</div>`;
  }

  function highScoresHtml(acc) {
    const hs = acc.highScores || {};
    const rows = Object.keys(hs).map(id => [sgpGameById(id), hs[id]]).filter(r => r[0]);
    if (!rows.length) return `<p class="faint">No high scores recorded yet — go play something!</p>`;
    rows.sort((a, b) => b[1] - a[1]);
    return `<table class="hs-table"><thead><tr><th>Game</th><th>Best Score</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${r[0].icon} ${r[0].name}</td><td>${r[1].toLocaleString()}</td></tr>`).join('')}
      </tbody></table>`;
  }

  function settingsHtml(acc, isGuest) {
    return `
      ${isGuest ? '' : `
      <div class="field"><label for="setUsername">Username</label>
        <div style="display:flex;gap:8px"><input id="setUsername" type="text" value="${SGPUI.escapeHtml(acc.username)}" maxlength="16"><button class="btn" id="setUsernameSave">Save</button></div>
        <div class="form-error" id="setUsernameErr"></div>
      </div>
      <div class="field"><label>Avatar</label><div class="avatar-pick" id="avatarPick"></div></div>
      <div class="field"><label>Avatar Frame</label><div class="avatar-pick" id="framePick"></div>
        <div class="form-hint">Unlock frames by leveling up or earning specific achievements.</div>
      </div>
      <div class="field"><label>Change Password</label>
        <input id="pwOld" type="password" placeholder="Current password" style="margin-bottom:6px">
        <input id="pwNew" type="password" placeholder="New password" style="margin-bottom:6px">
        <button class="btn" id="pwSave">Update Password</button>
        <div class="form-error" id="pwErr"></div>
      </div>
      <hr style="border-color:var(--border);margin:16px 0">`}
      <div class="settings-row"><span>Sound Effects</span><label class="switch"><input type="checkbox" id="setSound" ${acc.settings.sound ? 'checked' : ''}><span class="track"></span><span class="thumb"></span></label></div>
      <div class="settings-row"><span>Music</span><label class="switch"><input type="checkbox" id="setMusic" ${acc.settings.music ? 'checked' : ''}><span class="track"></span><span class="thumb"></span></label></div>
      <div class="settings-row"><span>School Mode <span class="faint" style="display:block;font-size:11px;font-weight:400">Quiet by default, fewer animations, compact UI</span></span><label class="switch"><input type="checkbox" id="setSchool" ${acc.settings.schoolMode ? 'checked' : ''}><span class="track"></span><span class="thumb"></span></label></div>
      <div class="settings-row"><span>Performance Mode <span class="faint" style="display:block;font-size:11px;font-weight:400">Lower = fewer particles & effects, less CPU</span></span>
        <div class="seg" id="perfSeg" style="width:180px">
          <button data-v="low" class="${acc.settings.performanceMode==='low'?'active':''}">Low</button>
          <button data-v="medium" class="${acc.settings.performanceMode==='medium'?'active':''}">Medium</button>
          <button data-v="high" class="${acc.settings.performanceMode==='high'?'active':''}">High</button>
        </div>
      </div>
      <div class="settings-row" style="display:block">
        <span>Theme</span>
        <div class="avatar-pick" id="themePick" style="margin-top:8px"></div>
      </div>
      <hr style="border-color:var(--border);margin:16px 0">
      <div class="field">
        <label>Save Data</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn" id="exportBtn">⬇ Export Save</button>
          ${isGuest ? '' : `<label class="btn" style="cursor:pointer">⬆ Import Save<input type="file" accept="application/json" id="importFile" style="display:none"></label>`}
        </div>
        <div class="form-hint">${isGuest ? 'Guest progress is not saved between sessions. Sign up to enable export/import.' : 'Export downloads a JSON file. Import it on another computer to continue this account there.'}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px">
        ${isGuest ? '' : `<button class="btn danger" id="resetBtn">Reset Local Account</button>`}
        <button class="btn ghost" id="logoutBtn">${isGuest ? 'Exit Guest Mode' : 'Log Out'}</button>
      </div>`;
  }

  function wireSettings(acc, isGuest) {
    function saveSettings(mutator) {
      const mutate = isGuest
        ? fn => { const g = getGuestAcc() || SGP.defaultAccount('Guest'); fn(g); sessionStorage.setItem('sgp_guest_account_v1', JSON.stringify(g)); return g; }
        : fn => SGP.updateCurrentAccount(fn);
      const updated = mutate(mutator);
      SGPUI.applySettings(updated.settings);
      return updated;
    }

    document.getElementById('setSound').addEventListener('change', e => saveSettings(a => a.settings.sound = e.target.checked));
    document.getElementById('setMusic').addEventListener('change', e => saveSettings(a => a.settings.music = e.target.checked));
    document.getElementById('setSchool').addEventListener('change', e => saveSettings(a => a.settings.schoolMode = e.target.checked));
    document.querySelectorAll('#perfSeg button').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('#perfSeg button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      saveSettings(a => a.settings.performanceMode = b.dataset.v);
    }));

    const themePick = document.getElementById('themePick');
    try {
      themePick.innerHTML = SGPCosmetics.THEMES.map(t => `
        <button data-t="${t.id}" title="${t.name}" class="${acc.settings.theme === t.id ? 'active' : ''}"
          style="background:linear-gradient(135deg,${t.accent},${t.accent2})"></button>`).join('');
      themePick.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        themePick.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        saveSettings(a => a.settings.theme = b.dataset.t);
      }));
    } catch (e) { themePick.innerHTML = '<span class="faint" style="font-size:11.5px">Couldn\'t load themes — try refreshing the page.</span>'; }

    document.getElementById('exportBtn').addEventListener('click', () => {
      const blob = isGuest ? { format: 'sgp-save', version: 1, exportedAt: Date.now(), account: getGuestAcc() } : SGP.exportSave();
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(blob, null, 2)], { type: 'application/json' }));
      a.download = (blob.account.username || 'save') + '-sgp-save.json';
      a.click();
      SGPUI.toast('Save exported');
    });

    if (!isGuest) {
      document.getElementById('setUsernameSave').addEventListener('click', () => {
        const val = document.getElementById('setUsername').value.trim();
        const err = document.getElementById('setUsernameErr');
        if (!SGPAuth.validUsername(val)) { err.textContent = 'Username must be 3-16 letters, numbers or _'; return; }
        try { SGP.renameCurrentAccount(val); location.reload(); } catch (e) { err.textContent = e.message; }
      });

      const pick = document.getElementById('avatarPick');
      pick.innerHTML = AVATARS.map(a => `<button data-a="${a}" class="${a === acc.avatar ? 'active' : ''}">${a}</button>`).join('');
      pick.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        SGP.updateCurrentAccount(a => a.avatar = b.dataset.a);
        pick.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        SGPUI.renderHeader('profile');
        document.querySelector('.avatar-lg').textContent = b.dataset.a;
      }));

      const framePick = document.getElementById('framePick');
      try {
      const unlocked = new Set(SGPCosmetics.unlockedFrames(acc).map(f => f.id));
      framePick.innerHTML = SGPCosmetics.FRAMES.map(f => {
        const isUnlocked = unlocked.has(f.id);
        return `<button data-f="${f.id}" title="${f.name}${isUnlocked ? '' : ' (locked)'}"
          class="${f.css || ''} ${acc.frame === f.id ? 'active' : ''} ${isUnlocked ? '' : 'frame-locked'}">${f.id === 'none' ? '🚫' : '🙂'}</button>`;
      }).join('');
      framePick.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        if (!unlocked.has(b.dataset.f)) { SGPUI.toast("You haven't unlocked that frame yet"); return; }
        SGP.updateCurrentAccount(a => a.frame = b.dataset.f);
        framePick.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        SGPUI.renderHeader('profile');
        const avEl = document.querySelector('.avatar-lg');
        avEl.className = 'avatar-lg ' + (SGPCosmetics.frameById(b.dataset.f).css || '');
      }));
      } catch (e) { framePick.innerHTML = '<span class="faint" style="font-size:11.5px">Couldn\'t load frames — try refreshing the page.</span>'; }

      document.getElementById('pwSave').addEventListener('click', async () => {
        const errEl = document.getElementById('pwErr');
        try {
          await SGPAuth.changePassword(document.getElementById('pwOld').value, document.getElementById('pwNew').value);
          errEl.style.color = 'var(--success)'; errEl.textContent = 'Password updated';
        } catch (e) { errEl.style.color = ''; errEl.textContent = e.message; }
      });

      const importFile = document.getElementById('importFile');
      if (importFile) importFile.addEventListener('change', () => {
        const f = importFile.files[0]; if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          try { SGP.importSave(JSON.parse(reader.result)); SGPUI.toast('Save imported'); location.reload(); }
          catch (e) { SGPUI.toast('Import failed: ' + e.message); }
        };
        reader.readAsText(f);
      });

      document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('This deletes your local account and all progress on this browser. This cannot be undone. Continue?')) {
          SGP.resetCurrentAccount();
          location.href = 'index.html';
        }
      });
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
      if (isGuest) SGP.setGuestMode(false); else SGPAuth.logOut();
      location.href = 'index.html';
    });
  }

  function renderProfile(acc, isGuest) {
    root.innerHTML = `
      ${isGuest ? `<div class="card" style="margin-bottom:16px;border-color:var(--gold)"><b>Playing as guest.</b> <span class="muted">Progress will be lost when you close this tab. <a href="#" id="guestSignup" style="color:var(--accent)">Sign up</a> to keep it.</span></div>` : ''}
      <div class="card profile-hero">
        <div class="avatar-lg ${SGPUI.frameCssSafe(acc.frame)}">${acc.avatar}</div>
        <div><b style="font-size:18px">${SGPUI.escapeHtml(acc.username)}</b></div>
        <div class="muted">Level ${acc.level} &middot; <span style="color:var(--gold)">${rankTitle(acc.level)}</span></div>
        ${xpBar(acc)}
      </div>
      ${statGrid(acc)}
      <div class="card">
        <div class="tabs" id="pTabs">
          <button data-t="achv" class="active">Achievements</button>
          <button data-t="fav">Favorites</button>
          <button data-t="hs">High Scores</button>
          <button data-t="set">Settings</button>
        </div>
        <div id="pTabBody"></div>
      </div>`;

    const body = document.getElementById('pTabBody');
    function show(t) {
      if (t === 'achv') body.innerHTML = achievementsHtml(acc);
      else if (t === 'fav') body.innerHTML = favoritesHtml(acc);
      else if (t === 'hs') body.innerHTML = highScoresHtml(acc);
      else { body.innerHTML = settingsHtml(acc, isGuest); wireSettings(acc, isGuest); }
    }
    document.querySelectorAll('#pTabs button').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('#pTabs button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      show(b.dataset.t);
    }));
    show('achv');

    const gs = document.getElementById('guestSignup');
    if (gs) gs.addEventListener('click', e => { e.preventDefault(); SGPUI.openAuthModal('signup'); });
  }

  SGPUI.renderHeader('profile');
  const acc = SGP.getCurrentAccount();
  if (acc) {
    renderProfile(acc, false);
  } else if (SGP.isGuestMode()) {
    renderProfile(getGuestAcc() || SGP.defaultAccount('Guest'), true);
  } else {
    renderSignedOut();
  }
})();
