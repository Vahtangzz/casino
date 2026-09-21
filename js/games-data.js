/* ===== Games registry — single source of truth for the portal grid & filters =====
   tags: 'under1' | 'under5' | 'endless' | 'multiplayer' | 'highscore'
   category: 'arcade' | 'puzzle' | 'skill' | 'casino' */
const SGP_GAMES = [
  { id: 'snake', name: 'Snake', icon: '🐍', category: 'arcade', desc: 'Classic grid snake. Eat, grow, don\'t hit yourself.',
    tags: ['endless', 'highscore'], path: 'games/snake.html' },
  { id: 'flappy', name: 'Flap Dash', icon: '🐤', category: 'arcade', desc: 'Tap or press space to flap through the gaps.',
    tags: ['endless', 'highscore', 'under1'], path: 'games/flappy.html' },
  { id: 'reaction', name: 'Reaction Test', icon: '⏱️', category: 'skill', desc: 'Click the instant the screen turns green.',
    tags: ['under1', 'highscore'], path: 'games/reaction.html' },
  { id: 'aim', name: 'Aim Trainer', icon: '🎯', category: 'skill', desc: 'Pop as many targets as you can in 30 seconds.',
    tags: ['under1', 'highscore'], path: 'games/aim.html' },
  { id: 'memory', name: 'Memory Match', icon: '🧠', category: 'puzzle', desc: 'Flip cards and find every matching pair.',
    tags: ['under5', 'highscore'], path: 'games/memory.html' },
  { id: '2048', name: '2048', icon: '🧩', category: 'puzzle', desc: 'Slide tiles and merge your way to 2048.',
    tags: ['endless', 'under5', 'highscore'], path: 'games/2048.html' },
  { id: 'minesweeper', name: 'Minesweeper', icon: '💣', category: 'puzzle', desc: 'Clear the board without triggering a mine.',
    tags: ['under5', 'highscore'], path: 'games/minesweeper.html' },
  { id: 'tictactoe', name: 'Tic-Tac-Toe', icon: '❌', category: 'puzzle', desc: 'Local 2-player or play against a computer AI. First to three in a row.',
    tags: ['under1', 'multiplayer'], path: 'games/tictactoe.html' },
  { id: 'clicker', name: 'Coin Clicker', icon: '👆', category: 'casino', desc: 'Click to earn coins and buy upgrades. Idle-friendly.',
    tags: ['endless', 'highscore'], path: 'games/clicker.html' },
  { id: 'breakout', name: 'Breakout', icon: '🧱', category: 'arcade', desc: 'Bounce the ball and clear every brick.',
    tags: ['under5', 'highscore'], path: 'games/breakout.html' },
  { id: 'racing', name: 'Lane Racer', icon: '🏎️', category: 'arcade', desc: 'Dodge traffic in an endless three-lane sprint.',
    tags: ['endless', 'under5', 'highscore'], path: 'games/racing.html' },
  { id: 'dodge', name: 'Dodge Storm', icon: '☄️', category: 'arcade', desc: 'Survive a falling storm of obstacles.',
    tags: ['endless', 'under5', 'highscore'], path: 'games/dodge.html' },
  { id: 'blackjack', name: 'Blackjack', icon: '🃏', category: 'casino', desc: 'Beat the dealer to 21. Virtual coins only.',
    tags: ['under5', 'highscore'], path: 'games/blackjack.html' },
  { id: 'roulette', name: 'Roulette', icon: '🎡', category: 'casino', desc: 'Bet on red, black, or a number. Virtual coins only.',
    tags: ['under1'], path: 'games/roulette.html' },
  { id: 'slots', name: 'Slots', icon: '🎰', category: 'casino', desc: 'Spin the reels for a virtual coin jackpot.',
    tags: ['under1'], path: 'games/slots.html' },
  { id: 'coinflip', name: 'Coin Flip', icon: '🪙', category: 'casino', desc: 'Heads or tails, double or nothing.',
    tags: ['under1'], path: 'games/coinflip.html' },
];

function sgpGameById(id) { return SGP_GAMES.find(g => g.id === id); }
