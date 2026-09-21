/* ===== Cosmetics — unlockable avatar frames + site themes ===== */
const SGPCosmetics = (() => {
  const FRAMES = [
    { id: 'none', name: 'No Frame', unlock: () => true },
    { id: 'bronze', name: 'Bronze Ring', css: 'frame-bronze', unlock: a => a.level >= 3 },
    { id: 'silver', name: 'Silver Ring', css: 'frame-silver', unlock: a => a.level >= 7 },
    { id: 'gold', name: 'Gold Ring', css: 'frame-gold', unlock: a => a.level >= 15 },
    { id: 'neon', name: 'Neon Pulse', css: 'frame-neon', unlock: a => (a.achievements || []).includes('ten_wins') },
    { id: 'diamond', name: 'Diamond', css: 'frame-diamond', unlock: a => a.level >= 25 },
    { id: 'legend', name: 'Legend', css: 'frame-legend', unlock: a => (a.achievements || []).includes('all_games_tried') },
  ];

  const THEMES = [
    { id: 'default', name: 'Midnight Blue', accent: '#5b8cff', accent2: '#35d0ba' },
    { id: 'sunset', name: 'Sunset', accent: '#ff8a4c', accent2: '#ff5d8f' },
    { id: 'violet', name: 'Violet', accent: '#a35cf0', accent2: '#e05ad8' },
    { id: 'forest', name: 'Forest', accent: '#35d07f', accent2: '#a8e063' },
    { id: 'crimson', name: 'Crimson Gold', accent: '#ff5d6c', accent2: '#f5b942' },
  ];

  function unlockedFrames(account) {
    return FRAMES.filter(f => { try { return f.unlock(account); } catch (e) { return false; } });
  }

  function frameById(id) { return FRAMES.find(f => f.id === id) || FRAMES[0]; }
  function themeById(id) { return THEMES.find(t => t.id === id) || THEMES[0]; }

  return { FRAMES, THEMES, unlockedFrames, frameById, themeById };
})();
