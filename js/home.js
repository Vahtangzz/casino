(() => {
  let activeFilter = 'all';
  let searchTerm = '';

  function matches(game) {
    if (searchTerm && !game.name.toLowerCase().includes(searchTerm) && !game.desc.toLowerCase().includes(searchTerm)) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'favorites') {
      const acc = SGPGame_activeAccountSafe();
      return acc && (acc.favorites || []).includes(game.id);
    }
    return game.tags.includes(activeFilter);
  }

  // home.js loads before game-api.js isn't included here (not needed), so read account directly
  function SGPGame_activeAccountSafe() {
    return SGP.getCurrentAccount() || (SGP.isGuestMode() ? JSON.parse(sessionStorage.getItem('sgp_guest_account_v1') || 'null') : null);
  }

  function cardHtml(game) {
    const acc = SGPGame_activeAccountSafe();
    const isFav = acc && (acc.favorites || []).includes(game.id);
    const best = acc && acc.highScores && acc.highScores[game.id];
    const tagLabel = { under1: '<1 min', under5: '<5 min', endless: 'Endless', multiplayer: '2-Player', highscore: 'High Score' };
    return `
      <div class="game-card" data-id="${game.id}" tabindex="0" role="button" aria-label="Play ${game.name}">
        <button class="fav-btn ${isFav ? 'active' : ''}" data-fav="${game.id}" aria-label="Toggle favorite">${isFav ? '★' : '☆'}</button>
        <div class="thumb">${game.icon}</div>
        <div class="gname">${game.name}</div>
        <div class="faint" style="font-size:11.5px">${game.desc}</div>
        <div class="gtags">${game.tags.map(t => `<span>${tagLabel[t] || t}</span>`).join('')}</div>
        ${best ? `<div class="best">🏆 Best: ${best.toLocaleString()}</div>` : ''}
      </div>`;
  }

  function render() {
    const grid = document.getElementById('gameGrid');
    const list = SGP_GAMES.filter(matches);
    grid.innerHTML = list.map(cardHtml).join('');
    document.getElementById('emptyMsg').style.display = list.length ? 'none' : 'block';
    document.getElementById('gridCount').textContent = list.length + ' game' + (list.length === 1 ? '' : 's');
    document.getElementById('gridTitle').textContent = activeFilter === 'all' ? 'All Games' : (activeFilter === 'favorites' ? 'Your Favorites' : 'Games');

    grid.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('[data-fav]')) return;
        const g = sgpGameById(card.dataset.id);
        location.href = g.path;
      });
      card.addEventListener('keydown', e => { if (e.key === 'Enter') card.click(); });
    });
    grid.querySelectorAll('[data-fav]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.fav);
        render();
      });
    });
  }

  function toggleFavorite(gameId) {
    if (!SGP.getCurrentAccount() && !SGP.isGuestMode()) { SGPUI.openAuthModal(); return; }
    const mutate = SGP.getCurrentAccount()
      ? fn => SGP.updateCurrentAccount(fn)
      : fn => { const g = JSON.parse(sessionStorage.getItem('sgp_guest_account_v1') || 'null') || SGP.defaultAccount('Guest'); fn(g); sessionStorage.setItem('sgp_guest_account_v1', JSON.stringify(g)); };
    mutate(acc => {
      acc.favorites = acc.favorites || [];
      const i = acc.favorites.indexOf(gameId);
      if (i >= 0) acc.favorites.splice(i, 1); else acc.favorites.push(gameId);
    });
  }

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      render();
    });
  });
  document.getElementById('searchInput').addEventListener('input', e => {
    searchTerm = e.target.value.trim().toLowerCase();
    render();
  });

  SGPUI.renderHeader('home');
  render();
})();
