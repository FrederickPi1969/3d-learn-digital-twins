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
  { id: '赤木家', x: 4, y: 1, color: 'red', door: [5, 3], spawn: [7, 8], message: '赤木家：地毯是暖红色的。' },
  { id: '蓝风屋', x: 10, y: 2, color: 'blue', door: [11, 4], spawn: [7, 8], message: '蓝风屋：窗外就是镇上的草地。' },
  { id: '旅人小屋', x: 14, y: 3, color: 'red', door: [15, 5], spawn: [7, 8], message: '旅人小屋：欢迎回来。' },
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
let walkFrame = 0;
let strideTimers = [];

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
  mapEl.className = scene === 'world' ? 'map tiny-town-world' : 'map interior-map';
  mapEl.style.gridTemplateColumns = `repeat(${rows[0].length}, 1fr)`;
  mapEl.style.gridTemplateRows = `repeat(${rows.length}, 1fr)`;
  rows.flatMap(row => [...row]).forEach(code => mapEl.append(createTile(code, scene !== 'world')));
  if (scene === 'world') {
    houses.forEach(renderDoor);
    renderAmbient();
  }
  locationEl.textContent = scene === 'world' ? '叶风镇 · 广场' : activeHouse.id;
  positionPlayer();
}

function renderDoor(house) {
  const marker = document.createElement('div');
  marker.className = 'door-marker';
  marker.dataset.house = house.id;
  marker.style.left = `${house.door[0] * 5 + 1.35}%`;
  marker.style.top = `${house.door[1] * (100 / 12) - .4}%`;
  mapEl.append(marker);
}

function renderAmbient() {
  const layer = document.createElement('div');
  layer.className = 'ambient-layer';
  [[20,24,1.7,7],[42,16,2.2,-12],[68,34,1.5,8],[84,19,2.5,-6]].forEach(([x,y,s,d]) => {
    const dot = document.createElement('i');
    dot.className = 'firefly'; dot.style.left = `${x}%`; dot.style.top = `${y}%`;
    dot.style.setProperty('--speed', `${s}s`); dot.style.setProperty('--drift', `${d}px`); layer.append(dot);
  });
  [[8,69,1.1],[34,78,1.5],[56,65,1.3],[92,71,1.7]].forEach(([x,y,s]) => {
    const leaf = document.createElement('i');
    leaf.className = 'leaf'; leaf.style.left = `${x}%`; leaf.style.top = `${y}%`;
    leaf.style.setProperty('--speed', `${s}s`); layer.append(leaf);
  });
  mapEl.append(layer);
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
  playerEl.className = `player facing-${player.facing} frame-${walkFrame}`;
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
  const marker = mapEl.querySelector(`[data-house="${house.id}"]`);
  marker?.classList.add('open');
  sceneEl.classList.add('transitioning');
  setTimeout(() => fadeTo(() => { scene = 'interior'; activeHouse = house; player = { x: 7, y: 8, facing: 'up' }; renderMap(); showToast(house.message); sceneEl.classList.remove('transitioning'); }), 120);
}
function exitHouse() {
  sceneEl.classList.add('transitioning');
  fadeTo(() => { scene = 'world'; player = { x: activeHouse.door[0], y: activeHouse.door[1] + 1, facing: 'down' }; renderMap(); showToast('回到了叶风镇。'); activeHouse = null; sceneEl.classList.remove('transitioning'); });
}

function move(direction) {
  if (moving) return;
  const delta = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] }[direction];
  player.facing = direction;
  const x = player.x + delta[0], y = player.y + delta[1];
  if (blocked(x, y)) { positionPlayer(); return; }
  player.x = x; player.y = y;
  strideTimers.forEach(clearTimeout);
  walkFrame = 1;
  positionPlayer();
  strideTimers = [
    setTimeout(() => { walkFrame = 2; positionPlayer(); }, 76),
    setTimeout(() => { walkFrame = 0; positionPlayer(); }, 152),
  ];
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
