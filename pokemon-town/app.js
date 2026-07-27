const worldRows = [
  'tttttttttttttttttttt',
  'tggggggggggggggggggt',
  'tgggggppppppggggggt',
  'tgggggppggppggggggt',
  'tggppppggppggppppgt',
  'tggpggggggggggpgggt',
  'tggpggggggggggpgggt',
  'tggppppppppppppgggt',
  'tgggggggggggggggggt',
  'tgggGGggggGGgggggggt',
  'twwwwwwwwwwwwwwwwwwt',
  'tttttttttttttttttttt',
];

const houses = [
  { id: '赤木家', x: 2, y: 2, color: 'red', door: [3, 4], spawn: [7, 8], message: '赤木家：地毯是暖红色的。' },
  { id: '蓝风屋', x: 8, y: 2, color: 'blue', door: [9, 4], spawn: [7, 8], message: '蓝风屋：窗外就是镇上的草地。' },
  { id: '旅人小屋', x: 14, y: 5, color: 'red', door: [15, 7], spawn: [7, 8], message: '旅人小屋：欢迎回来。' },
];
const interiorRows = [
  'wwwwwwwwwwwwww', 'w............w', 'w..b.....p...w', 'w............w', 'w....cccc....w',
  'w....cccc....w', 'w............w', 'w...t......b.w', 'w......e.....w', 'wwwwwwwwwwwwww',
];
const worldClassFor = { g:'ground', p:'path', t:'tree', w:'water', G:'tall-grass' };
const interiorClassFor = { '.':'floor', c:'carpet', b:'bed', p:'plant', t:'table', e:'exit-mat' };
const mapEl = document.querySelector('#map');
const playerEl = document.querySelector('#player');
const locationEl = document.querySelector('#location');
const toastEl = document.querySelector('#toast');
const fadeEl = document.querySelector('#fade');
const sceneEl = document.querySelector('#scene');
let scene = 'world';
let activeHouse = null;
let player = { x: 10, y: 7, facing: 'down' };
let moving = false;
let toastTimer;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function createTile(code, isInterior) {
  const tile = document.createElement('div');
  const tileClass = isInterior ? (interiorClassFor[code] || 'floor') : (worldClassFor[code] || 'ground');
  tile.className = `tile ${tileClass}`;
  if (isInterior && code === 'w') tile.classList.add('wall-tile');
  return tile;
}

function renderMap() {
  const rows = scene === 'world' ? worldRows : interiorRows;
  mapEl.innerHTML = '';
  mapEl.className = scene === 'world' ? 'map' : 'map interior-map';
  mapEl.style.gridTemplateColumns = `repeat(${rows[0].length}, 1fr)`;
  mapEl.style.gridTemplateRows = `repeat(${rows.length}, 1fr)`;
  rows.flatMap(row => [...row]).forEach(code => mapEl.append(createTile(code, scene !== 'world')));
  if (scene === 'world') houses.forEach(renderHouse);
  locationEl.textContent = scene === 'world' ? '叶风镇 · 广场' : activeHouse.id;
  positionPlayer();
}

function renderHouse(house) {
  const el = document.createElement('div');
  el.className = `house ${house.color}`;
  el.style.left = `${house.x * 5}%`;
  el.style.top = `${house.y * (100 / 12)}%`;
  el.innerHTML = '<span class="roof"></span><span class="wall"></span><span class="window left"></span><span class="window right"></span><span class="door"></span><span class="sign"></span>';
  mapEl.append(el);
}

function positionPlayer() {
  const rows = scene === 'world' ? worldRows : interiorRows;
  playerEl.style.left = `${player.x * (100 / rows[0].length)}%`;
  playerEl.style.top = `${player.y * (100 / rows.length)}%`;
  playerEl.className = `player facing-${player.facing}`;
}

function blocked(x, y) {
  const rows = scene === 'world' ? worldRows : interiorRows;
  if (y < 0 || y >= rows.length || x < 0 || x >= rows[0].length) return true;
  const code = rows[y][x];
  if (scene === 'world') {
    if ('tGw'.includes(code)) return true;
    return houses.some(h => x >= h.x && x < h.x + 3 && y >= h.y && y < h.y + 3 && !(x === h.door[0] && y === h.door[1]));
  }
  return code === 'w' || code === 'b' || code === 't' || code === 'p';
}

function fadeTo(callback) {
  moving = true;
  fadeEl.classList.add('active');
  setTimeout(() => {
    callback();
    setTimeout(() => { fadeEl.classList.remove('active'); moving = false; }, 80);
  }, 230);
}

function enter(house) {
  fadeTo(() => { scene = 'interior'; activeHouse = house; player = { x: 7, y: 8, facing: 'up' }; renderMap(); showToast(house.message); });
}
function exitHouse() {
  fadeTo(() => { scene = 'world'; player = { x: activeHouse.door[0], y: activeHouse.door[1] + 1, facing: 'down' }; renderMap(); showToast('回到了叶风镇。'); activeHouse = null; });
}

function move(direction) {
  if (moving) return;
  const delta = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] }[direction];
  player.facing = direction;
  const x = player.x + delta[0], y = player.y + delta[1];
  if (blocked(x, y)) { positionPlayer(); return; }
  player.x = x; player.y = y; positionPlayer();
  if (scene === 'world') {
    const house = houses.find(h => h.door[0] === x && h.door[1] === y);
    if (house) setTimeout(() => enter(house), 130);
  } else if (interiorRows[y][x] === 'e') setTimeout(exitHouse, 130);
}

document.addEventListener('keydown', event => {
  const keys = { ArrowUp:'up', w:'up', W:'up', ArrowDown:'down', s:'down', S:'down', ArrowLeft:'left', a:'left', A:'left', ArrowRight:'right', d:'right', D:'right' };
  if (keys[event.key]) { event.preventDefault(); move(keys[event.key]); }
});
document.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => move(button.dataset.move)));
document.querySelector('#reset-button').addEventListener('click', () => {
  if (moving) return;
  scene = 'world'; activeHouse = null; player = { x:10, y:7, facing:'down' }; renderMap(); showToast('已回到镇中心。');
});
renderMap();
