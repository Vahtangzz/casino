/* ===== Game API — shared helper every game page uses to talk to the save system =====
   Include order on a game page: storage.js, auth.js, achievements.js, games-data.js, ui.js, game-api.js */
const SGPGame = (() => {
  const GUEST_KEY = 'sgp_guest_account_v1';

  function getGuestAccount() {
    let g = null;
    try { g = JSON.parse(sessionStorage.getItem(GUEST_KEY) || 'null'); } catch (e) {}
    if (!g) { g = SGP.defaultAccount('Guest'); saveGuestAccount(g); }
    return g;
  }
  function saveGuestAccount(g) { sessionStorage.setItem(GUEST_KEY, JSON.stringify(g)); }

  function isLoggedIn() { return !!SGP.getCurrentAccount(); }

  function activeAccount() {
    return isLoggedIn() ? SGP.getCurrentAccount() : getGuestAccount();
  }

  function mutateActive(fn) {
    if (isLoggedIn()) return SGP.updateCurrentAccount(fn);
    const g = getGuestAccount();
    fn(g);
    saveGuestAccount(g);
    return g;
  }

  function ensurePlayable() {
    if (!isLoggedIn() && !SGP.isGuestMode()) SGP.setGuestMode(true);
  }

  function getSettings() { return activeAccount().settings; }

  // School Mode always mutes, regardless of the sound toggle.
  function audioAllowed() {
    const s = getSettings();
    return !!s.sound && !s.schoolMode;
  }

  // 0 (low) .. 1 (high) multiplier for particle/animation-heavy effects.
  function particleScale() {
    const m = getSettings().performanceMode;
    return m === 'low' ? 0 : m === 'medium' ? 0.45 : 1;
  }

  let audioCtx = null;
  function beep(freq = 440, dur = 0.08, type = 'square', gain = 0.05) {
    if (!audioAllowed()) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type; osc.frequency.value = freq;
      g.gain.value = gain;
      osc.connect(g); g.connect(audioCtx.destination);
      osc.start();
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) { /* audio not available */ }
  }

  let topbarRefresh = null;

  function renderTopbar(meta) {
    ensurePlayable();
    const mount = document.getElementById('gameTopbar');
    if (!mount) return;
    const acc = activeAccount();
    const isFav = (acc.favorites || []).includes(meta.id);
    mount.innerHTML = `
      <div class="game-topbar">
        <a class="hdr-btn" href="../index.html">&larr; Games</a>
        <div class="gtitle">${meta.icon} ${SGPUI.escapeHtml(meta.title)}</div>
        <button class="hdr-btn" id="gtFav">${isFav ? '★ Favorited' : '☆ Favorite'}</button>
        <div class="hdr-stat" id="gtCoins">🪙 ${SGPUI.fmt(acc.coins)}</div>
        <div class="hdr-stat" id="gtLevel">⭐ Lv.${acc.level}</div>
      </div>`;
    mount.querySelector('#gtFav').addEventListener('click', () => toggleFavorite(meta.id));
    topbarRefresh = () => {
      const a = activeAccount();
      const favBtn = mount.querySelector('#gtFav');
      if (favBtn) favBtn.textContent = (a.favorites || []).includes(meta.id) ? '★ Favorited' : '☆ Favorite';
      bumpText(mount.querySelector('#gtCoins'), '🪙 ' + SGPUI.fmt(a.coins));
      bumpText(mount.querySelector('#gtLevel'), '⭐ Lv.' + a.level);
    };
  }

  function bumpText(el, newText) {
    if (!el) return;
    const changed = el.textContent !== newText;
    el.textContent = newText;
    if (changed && particleScale() > 0) {
      el.classList.remove('stat-bump');
      void el.offsetWidth;
      el.classList.add('stat-bump');
    }
  }

  function toggleFavorite(gameId) {
    mutateActive(acc => {
      acc.favorites = acc.favorites || [];
      const i = acc.favorites.indexOf(gameId);
      if (i >= 0) acc.favorites.splice(i, 1); else acc.favorites.push(gameId);
    });
    if (topbarRefresh) topbarRefresh();
  }

  function adjustCoins(delta) {
    const acc = mutateActive(a => { a.coins = Math.max(0, a.coins + delta); });
    if (topbarRefresh) topbarRefresh();
    return acc.coins;
  }

  // Call once when a round/game-over happens.
  // result: { score, won, coinsDelta, xpDelta, extraStats }
  function reportResult(gameId, result) {
    const { score = null, won = false, coinsDelta = 0, xpDelta = 0, extraStats = {} } = result || {};
    let leveledUp = false, newLevel = 1, unlocked = [];
    const acc = mutateActive(a => {
      a.gamesPlayed = (a.gamesPlayed || 0) + 1;
      if (won) a.wins = (a.wins || 0) + 1;
      if (score !== null) {
        a.highScores = a.highScores || {};
        a.highScores[gameId] = Math.max(a.highScores[gameId] || 0, score);
      }
      a.stats = a.stats || {};
      const prev = a.stats[gameId] || { plays: 0, best: null };
      a.stats[gameId] = Object.assign({}, prev, {
        plays: (prev.plays || 0) + 1,
        best: score !== null ? Math.max(prev.best == null ? -Infinity : prev.best, score) : prev.best,
        last: score !== null ? score : prev.last
      }, extraStats, mergeBest(prev, extraStats));
      a.coins = Math.max(0, a.coins + coinsDelta);
      a.xp = Math.max(0, a.xp + xpDelta);
      const lv = SGPUI.levelForXP(a.xp);
      leveledUp = lv.level > a.level;
      newLevel = lv.level;
      a.level = lv.level;
      unlocked = SGPAchievements.evaluate(a, SGP_GAMES.length);
    });
    if (leveledUp) SGPUI.toast('🎉 Level up! You reached level ' + newLevel, 'gold');
    unlocked.forEach(u => SGPUI.toast('🏆 Achievement: ' + u.t, 'gold'));
    if (coinsDelta > 0) SGPUI.toast('+' + SGPUI.fmt(coinsDelta) + ' coins', 'success');
    if (topbarRefresh) topbarRefresh();
    return acc;
  }

  // extraStats fields like {best: n} for a "best of" custom stat (e.g. reaction ms, lower-is-better)
  function mergeBest(prev, extraStats) {
    const out = {};
    if (extraStats && typeof extraStats.customBest === 'number') {
      const better = prev.customBest == null || extraStats.customBest < prev.customBest;
      out.customBest = better ? extraStats.customBest : prev.customBest;
    }
    if (extraStats && typeof extraStats.maxTile === 'number') {
      out.maxTile = Math.max(prev.maxTile || 0, extraStats.maxTile);
    }
    return out;
  }

  function mountDirPad(el, handlers) {
    if (!el) return;
    el.classList.add('touch-pad');
    const layout = [
      '', 'up', '',
      'left', '', 'right',
      '', 'down', ''
    ];
    const labels = { up: '▲', down: '▼', left: '◀', right: '▶' };
    layout.forEach(dir => {
      const b = document.createElement('button');
      if (dir) {
        b.textContent = labels[dir];
        b.addEventListener('pointerdown', e => { e.preventDefault(); handlers['on' + cap(dir)] && handlers['on' + cap(dir)](); });
      } else {
        b.style.visibility = 'hidden';
      }
      el.appendChild(b);
    });
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function mountActionButton(el, label, onPress) {
    if (!el) return;
    const b = document.createElement('button');
    b.className = 'btn primary';
    b.style.cssText = 'width:78px;height:78px;border-radius:50%;font-size:22px;margin-top:8px;';
    b.textContent = label;
    b.addEventListener('pointerdown', e => { e.preventDefault(); onPress(); });
    el.appendChild(b);
  }

  return {
    activeAccount, mutateActive, isLoggedIn, getSettings, renderTopbar,
    toggleFavorite, adjustCoins, reportResult, mountDirPad, mountActionButton,
    audioAllowed, particleScale, beep
  };
})();
