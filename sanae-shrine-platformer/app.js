const world = document.querySelector('#world');
const terrain = document.querySelector('#terrain');
const playerEl = document.querySelector('#player');
const effects = document.querySelector('#effects');
const scoreEl = document.querySelector('#score');
const defeatedEl = document.querySelector('#defeated');
const livesEl = document.querySelector('#lives');
const title = document.querySelector('#title-screen');
const pause = document.querySelector('#pause-screen');
const complete = document.querySelector('#complete-screen');
const gameOver = document.querySelector('#game-over-screen');
const completeScore = document.querySelector('#complete-score');

const WIDTH = 4320;
const VIEW_WIDTH = 960;
const PLAYER_W = 120;
const PLAYER_H = 130;
const GROUND_Y = 475;
const MOVE_SPEED = 210;
const JUMP_SPEED = 470;
const GRAVITY = 1080;
const TICK_SECONDS = 1 / 60;

let playing = false;
let paused = false;
let grounded = true;
let x = 112;
let y = GROUND_Y - PLAYER_H;
let velocityY = 0;
let facing = 'right';
let score = 0;
let kills = 0;
let lives = 3;
let dead = false;
let walkFrame = 0;
let animationClock = 0;
let cameraX = 0;

const held = new Set();
const playerFramePath = (frame) => `assets/processed/${facing === 'left' ? 'player-frames-left' : 'player-frames'}/player-${frame}.png?v=9`;
const yokaiFramePath = (frame) => `assets/processed/yokai-frames/yokai-${frame}.png?v=9`;

const platforms = [
  [0, 475, 760, 110, 'ground'],
  [900, 475, 520, 110, 'ground'],
  [1560, 475, 520, 110, 'ground'],
  [2220, 475, 680, 110, 'ground'],
  [3050, 475, 1270, 110, 'ground'],
  [480, 385, 170, 30, 'stone'],
  [790, 330, 135, 30, 'stone'],
  [1110, 370, 170, 30, 'stone'],
  [1390, 305, 135, 30, 'stone'],
  [1820, 365, 150, 30, 'stone'],
  [2050, 295, 150, 30, 'stone'],
  [2475, 370, 170, 30, 'stone'],
  [2760, 300, 135, 30, 'stone'],
  [3055, 360, 150, 30, 'stone'],
  [3450, 360, 190, 30, 'stone']
];

const enemies = [
  [480, 475],
  [1180, 475],
  [1870, 365],
  [2520, 475],
  [3540, 475]
].map(([enemyX, surface], id) => ({ id, x: enemyX, y: surface - 88, alive: true }));

function buildLevel() {
  terrain.style.width = `${WIDTH}px`;
  platforms.forEach(([px, py, width, height, kind]) => {
    const tile = document.createElement('div');
    tile.className = `platform ${kind}`;
    tile.style.cssText = `left:${px}px;top:${py}px;width:${width}px;height:${height}px`;
    terrain.append(tile);
  });

  enemies.forEach((enemy) => {
    const image = document.createElement('img');
    image.className = `enemy ${enemy.id % 2 ? 'reverse' : ''}`;
    image.id = `enemy-${enemy.id}`;
    image.src = yokaiFramePath(0);
    image.draggable = false;
    image.alt = '';
    image.style.left = `${enemy.x}px`;
    image.style.top = `${enemy.y}px`;
    world.append(image);
    enemy.el = image;
  });
}

function surfacesAt(centerX) {
  const feetLeft = centerX - 22;
  const feetRight = centerX + 22;
  return platforms
    .filter(([px, , width]) => Math.min(feetRight, px + width) - Math.max(feetLeft, px) >= 6)
    .map(([, py]) => py)
    .sort((a, b) => a - b);
}

function hasSupport(centerX, bottom) {
  return surfacesAt(centerX).some((surface) => Math.abs(surface - bottom) <= 3);
}

function landingSurface(centerX, previousBottom, nextBottom) {
  const crossed = surfacesAt(centerX).filter(
    (surface) => surface >= previousBottom - 2 && surface <= nextBottom + 2
  );
  return crossed.length ? crossed[0] : null;
}

function horizontalDirection() {
  const left = held.has('left');
  const right = held.has('right');
  if (left === right) return 0;
  return left ? -1 : 1;
}

function setPlayerFrame(frame) {
  const nextSource = playerFramePath(frame);
  if (!playerEl.src.endsWith(nextSource)) playerEl.src = nextSource;
}

function updatePlayerAnimation(direction) {
  if (!grounded) {
    setPlayerFrame(velocityY < 0 ? 8 : 10);
    return;
  }
  if (!direction) {
    animationClock = 0;
    walkFrame = 0;
    setPlayerFrame(0);
    return;
  }
  animationClock += TICK_SECONDS;
  if (animationClock >= 0.105) {
    animationClock = 0;
    walkFrame = (walkFrame + 1) % 4;
    setPlayerFrame(4 + walkFrame);
  }
}

function movePlayer() {
  const direction = horizontalDirection();
  if (direction) {
    const nextFacing = direction < 0 ? 'left' : 'right';
    if (nextFacing !== facing) {
      facing = nextFacing;
      setPlayerFrame(grounded ? 4 + walkFrame : velocityY < 0 ? 8 : 10);
    }
    x += direction * MOVE_SPEED * TICK_SECONDS;
    x = Math.max(0, Math.min(WIDTH - PLAYER_W - 24, x));
  }

  const centerX = x + PLAYER_W / 2;
  const previousBottom = y + PLAYER_H;

  if (grounded && !hasSupport(centerX, previousBottom)) {
    grounded = false;
    velocityY = 0;
  }

  if (!grounded) {
    velocityY += GRAVITY * TICK_SECONDS;
    const nextY = y + velocityY * TICK_SECONDS;
    const nextBottom = nextY + PLAYER_H;
    const surface = velocityY >= 0 ? landingSurface(centerX, previousBottom, nextBottom) : null;

    if (surface !== null) {
      y = surface - PLAYER_H;
      velocityY = 0;
      grounded = true;
      playerEl.classList.add('landing');
      setTimeout(() => playerEl.classList.remove('landing'), 90);
    } else {
      y = nextY;
    }
  }

  updatePlayerAnimation(direction);
  checkEnemyCollisions();

  if (y > 575) respawn();
  if (x > 3950) finish();
}

function jump() {
  if (!playing || paused || !grounded) return;
  grounded = false;
  velocityY = -JUMP_SPEED;
  setPlayerFrame(8);
}

function checkEnemyCollisions() {
  const playerRect = playerEl.getBoundingClientRect();
  const playerHit = {
    left: playerRect.left + 18,
    right: playerRect.right - 18,
    top: playerRect.top + 8,
    bottom: playerRect.bottom - 4
  };
  const victim = enemies.find((enemy) => {
    if (!enemy.alive) return false;
    const enemyRect = enemy.el.getBoundingClientRect();
    const enemyHit = {
      left: enemyRect.left + 24,
      right: enemyRect.right - 8,
      top: enemyRect.top + 22,
      bottom: enemyRect.bottom - 12
    };
    const horizontalOverlap = playerHit.right > enemyHit.left && playerHit.left < enemyHit.right;
    const verticalOverlap = playerHit.bottom > enemyHit.top && playerHit.top < enemyHit.bottom;
    if (!horizontalOverlap || !verticalOverlap) return false;
    enemy.hitBox = enemyHit;
    return true;
  });

  if (!victim) return;
  const stompedFromAbove =
    velocityY > 70 &&
    playerHit.bottom >= victim.hitBox.top &&
    playerHit.bottom <= victim.hitBox.top + 28;

  if (!stompedFromAbove) {
    die();
    return;
  }

  victim.alive = false;
  victim.el.src = yokaiFramePath(4);
  victim.el.classList.add('stomped');
  velocityY = -285;
  grounded = false;
  score += 100;
  kills += 1;
  pop(victim.x + 42, victim.y + 35);
  setTimeout(() => victim.el.remove(), 420);
}

function updateCamera() {
  const target = Math.max(0, Math.min(WIDTH - VIEW_WIDTH, x - 300));
  cameraX += (target - cameraX) * 0.09;
  if (Math.abs(target - cameraX) < 0.05) cameraX = target;
}

function render() {
  playerEl.style.left = `${x.toFixed(2)}px`;
  playerEl.style.top = `${y.toFixed(2)}px`;
  world.style.left = `${-cameraX.toFixed(2)}px`;
  document.querySelector('.sky').style.backgroundPositionX = '0px';
  document.querySelector('.mountains').style.backgroundPositionX = `${(-cameraX * 0.025).toFixed(2)}px`;
  document.querySelector('.forest').style.backgroundPositionX = `${(-cameraX * 0.08).toFixed(2)}px`;
  scoreEl.textContent = `信仰点 ${String(score).padStart(3, '0')}`;
  defeatedEl.textContent = `妖怪 ${kills} / 5`;
  livesEl.textContent = `生命 ${'♥'.repeat(lives)}${'·'.repeat(3 - lives)}`;
}

function gameTick() {
  if (!playing || paused || dead) return;
  movePlayer();
  updateCamera();
  render();
}

function respawn() {
  x = 112;
  y = GROUND_Y - PLAYER_H;
  velocityY = 0;
  grounded = true;
  dead = false;
  facing = 'right';
  held.clear();
  playerEl.classList.remove('hurt');
  setPlayerFrame(0);
  cameraX = 0;
  render();
}

function die() {
  if (dead) return;
  dead = true;
  held.clear();
  lives = Math.max(0, lives - 1);
  score = Math.max(0, score - 50);
  setPlayerFrame(14);
  playerEl.classList.add('hurt');
  render();
  setTimeout(() => {
    if (lives === 0) {
      playing = false;
      gameOver.hidden = false;
    } else {
      respawn();
    }
  }, 650);
}

function pop(px, py) {
  const effect = document.createElement('div');
  effect.className = 'pop';
  effect.style.left = `${px}px`;
  effect.style.top = `${py}px`;
  effects.append(effect);
  effect.addEventListener('animationend', () => effect.remove());
}

function finish() {
  if (!playing) return;
  playing = false;
  completeScore.textContent = `信仰点 ${score} · 击退妖怪 ${kills} 只`;
  complete.hidden = false;
}

function togglePause() {
  if (!playing) return;
  paused = !paused;
  pause.hidden = !paused;
}

document.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(event.code)) event.preventDefault();
  if (event.code === 'Escape') {
    togglePause();
    return;
  }
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') held.add('left');
  if (event.code === 'ArrowRight' || event.code === 'KeyD') held.add('right');
  if (!event.repeat && (event.code === 'ArrowUp' || event.code === 'KeyW' || event.code === 'Space')) jump();
});

document.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') held.delete('left');
  if (event.code === 'ArrowRight' || event.code === 'KeyD') held.delete('right');
});

document.querySelector('#start-button').onclick = () => {
  title.hidden = true;
  playing = true;
};
document.querySelector('#resume-button').onclick = togglePause;
document.querySelector('#restart-button').onclick = () => location.reload();
document.querySelector('#retry-button').onclick = () => location.reload();

// Decode all character frames before play, preventing an old direction frame from
// remaining visible while the next PNG is being decoded.
for (const direction of ['player-frames', 'player-frames-left']) {
  for (let frame = 0; frame < 16; frame += 1) {
    const image = new Image();
    image.src = `assets/processed/${direction}/player-${frame}.png?v=9`;
  }
}

buildLevel();
render();
setInterval(gameTick, 1000 / 60);
