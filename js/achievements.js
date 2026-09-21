/* ===== Achievements ===== */
const SGPAchievements = (() => {
  const LIST = [
    { id: 'first_game', t: 'First Steps', d: 'Play your first game', ic: '👟', check: a => a.gamesPlayed >= 1 },
    { id: 'ten_games', t: 'Warming Up', d: 'Play 10 games', ic: '🔥', check: a => a.gamesPlayed >= 10 },
    { id: 'fifty_games', t: 'Regular', d: 'Play 50 games', ic: '🎮', check: a => a.gamesPlayed >= 50 },
    { id: 'hundred_games', t: 'Dedicated', d: 'Play 100 games', ic: '🏅', check: a => a.gamesPlayed >= 100 },
    { id: 'first_win', t: 'Winner Winner', d: 'Win your first game', ic: '🏆', check: a => a.wins >= 1 },
    { id: 'ten_wins', t: 'On a Streak', d: 'Win 10 games', ic: '⚡', check: a => a.wins >= 10 },
    { id: 'level_5', t: 'Leveling Up', d: 'Reach level 5', ic: '⭐', check: a => a.level >= 5 },
    { id: 'level_10', t: 'High Roller', d: 'Reach level 10', ic: '🌟', check: a => a.level >= 10 },
    { id: 'level_25', t: 'Legend', d: 'Reach level 25', ic: '👑', check: a => a.level >= 25 },
    { id: 'coins_1000', t: 'Piggy Bank', d: 'Hold 1,000 coins', ic: '🪙', check: a => a.coins >= 1000 },
    { id: 'coins_10000', t: 'Coin Collector', d: 'Hold 10,000 coins', ic: '💰', check: a => a.coins >= 10000 },
    { id: 'coins_50000', t: 'Tycoon', d: 'Hold 50,000 coins', ic: '💎', check: a => a.coins >= 50000 },
    { id: 'five_games_tried', t: 'Explorer', d: 'Try 5 different games', ic: '🧭', check: a => Object.keys(a.stats || {}).length >= 5 },
    { id: 'ten_games_tried', t: 'Completionist', d: 'Try 10 different games', ic: '🗺️', check: a => Object.keys(a.stats || {}).length >= 10 },
    { id: 'all_games_tried', t: 'Arcade Master', d: 'Try every game', ic: '🕹️', check: (a, gamesCount) => Object.keys(a.stats || {}).length >= gamesCount },
    { id: 'three_favorites', t: 'Curator', d: 'Favorite 3 games', ic: '❤️', check: a => (a.favorites || []).length >= 3 },
    { id: 'snake_50', t: 'Slitherer', d: 'Score 50+ in Snake', ic: '🐍', check: a => (a.highScores && a.highScores.snake) >= 50 },
    { id: '2048_reach', t: 'Tile Master', d: 'Reach 2048 in the puzzle game', ic: '🧩', check: a => a.stats && a.stats['2048'] && a.stats['2048'].maxTile >= 2048 },
    { id: 'reaction_fast', t: 'Quick Reflexes', d: 'React in under 250ms', ic: '⏱️', check: a => a.stats && a.stats.reaction && a.stats.reaction.customBest != null && a.stats.reaction.customBest <= 250 },
    { id: 'blackjack_win5', t: 'Card Shark', d: 'Win 5 blackjack hands', ic: '🃏', check: a => a.stats && a.stats.blackjack && a.stats.blackjack.wins >= 5 },
  ];

  function unlockedIds(account) { return account.achievements || []; }

  // Returns list of NEWLY unlocked achievement objects
  function evaluate(account, totalGamesCount) {
    const have = new Set(account.achievements || []);
    const newlyUnlocked = [];
    LIST.forEach(a => {
      if (have.has(a.id)) return;
      let ok = false;
      try { ok = a.check(account, totalGamesCount); } catch (e) { ok = false; }
      if (ok) { have.add(a.id); newlyUnlocked.push(a); }
    });
    account.achievements = Array.from(have);
    return newlyUnlocked;
  }

  return { LIST, unlockedIds, evaluate };
})();
