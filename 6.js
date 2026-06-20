// PRISMVault Interactive presents:
// NEON DEPTHS: STICKER RELIC
// 3D-style ROM for the custom RAM/VRAM engine
//
// Design goals:
// - RAM-only gameplay state
// - High-resolution viewport
// - 3D-style raycast rooms
// - Multiple levels
// - Story + ending
// - Animated billboard sprites
// - Uses safe direct VRAM writes
//
// Required engine globals:
// - vram
// - ram
// - currentGameLoop

// --------------------------------------------------
// 0) RESET / SETUP
// --------------------------------------------------
if (typeof currentGameLoop !== "undefined" && currentGameLoop) {
  clearInterval(currentGameLoop);
  currentGameLoop = null;
}

// High-resolution virtual screen
vram.length = 0;
for (let y = 0; y < 96; y++) {
  const row = [];
  for (let x = 0; x < 128; x++) row.push([0, 0, 0]);
  vram.push(row);
}

for (let i = 0; i < 64; i++) {
  if (!ram[i]) ram[i] = { st: 0 };
  if (typeof ram[i].st !== "number" && typeof ram[i].st !== "boolean") ram[i].st = 0;
}

// --------------------------------------------------
// 1) RAM MAP
// --------------------------------------------------
// 0 A
// 1 B
// 2 Up
// 3 Down
// 4 Left
// 5 Right
// 6 Start
// 7 Select
// 8 Frame
// 9 Game State
// 10 Menu Cursor / story page
// 11 Player X (fixed-point-ish)
// 12 Player Y
// 13 Player Angle (0-359)
// 14 Player Health
// 15 Player Speed
// 16 Current Level
// 17 Keys
// 18 Gate Open
// 19 Level Clear 1
// 20 Level Clear 2
// 21 Level Clear 3
// 22 Enemy A X
// 23 Enemy A Y
// 24 Enemy A Dir
// 25 Enemy B X
// 26 Enemy B Y
// 27 Enemy B Dir
// 28 Enemy C X
// 29 Enemy C Y
// 30 Enemy C Dir
// 31 Relic X
// 32 Relic Y
// 33 Relic Collected
// 34 Door X
// 35 Door Y
// 36 Door Active
// 37 Terminal X
// 38 Terminal Y
// 39 Terminal Visited
// 40 Companion X
// 41 Companion Y
// 42 Companion Saved
// 43 Hurt Timer
// 44 Dialogue Timer
// 45 Ending Flag
// 46 Map Cursor
// 47 Blink
// 48 Last A
// 49 Last Start
// 50 Last Left
// 51 Last Right
// 52 Last Up
// 53 Last Down
// 54 Story Beat
// 55 Score
// 56 Theme
// 57 Secret Found
// 58 Checkpoint X
// 59 Checkpoint Y
// 60 Checkpoint Level
// 61 Cutscene Step
// 62 FOV Scale
// 63 Spare

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}
function rand(n) { return Math.floor(Math.random() * n); }
function angleWrap(a) {
  while (a < 0) a += 360;
  while (a >= 360) a -= 360;
  return a;
}
function angToRad(a) { return a * Math.PI / 180; }
function isPressed(i) { return !!ram[i].st; }
function clearScreen(r, g, b) {
  for (let y = 0; y < vram.length; y++) {
    for (let x = 0; x < vram[0].length; x++) vram[y][x] = [r, g, b];
  }
}
function px(x, y, r, g, b) {
  x = Math.floor(x); y = Math.floor(y);
  if (y >= 0 && y < vram.length && x >= 0 && x < vram[0].length) {
    vram[y][x] = [r, g, b];
  }
}
function rect(x1, y1, x2, y2, r, g, b) {
  const ax = Math.max(0, Math.floor(Math.min(x1, x2)));
  const ay = Math.max(0, Math.floor(Math.min(y1, y2)));
  const bx = Math.min(vram[0].length - 1, Math.floor(Math.max(x1, x2)));
  const by = Math.min(vram.length - 1, Math.floor(Math.max(y1, y2)));
  for (let y = ay; y <= by; y++) {
    for (let x = ax; x <= bx; x++) vram[y][x] = [r, g, b];
  }
}
function outline(x1, y1, x2, y2, r, g, b) {
  rect(x1, y1, x2, y1, r, g, b);
  rect(x1, y2, x2, y2, r, g, b);
  rect(x1, y1, x1, y2, r, g, b);
  rect(x2, y1, x2, y2, r, g, b);
}
function triStripe(y, r1, g1, b1, r2, g2, b2) {
  for (let x = 0; x < vram[0].length; x++) {
    const t = x / (vram[0].length - 1);
    const rr = Math.floor(r1 + (r2 - r1) * t);
    const gg = Math.floor(g1 + (g2 - g1) * t);
    const bb = Math.floor(b1 + (b2 - b1) * t);
    vram[y][x] = [rr, gg, bb];
  }
}
function tinyText(str, x, y, r, g, b) {
  // tiny block font good enough for story + UI
  const G = {
    A:[[0,1,0],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
    B:[[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,1,0]],
    C:[[0,1,1],[1,0,0],[1,0,0],[1,0,0],[0,1,1]],
    D:[[1,1,0],[1,0,1],[1,0,1],[1,0,1],[1,1,0]],
    E:[[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,1,1]],
    F:[[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,0,0]],
    G:[[0,1,1],[1,0,0],[1,0,1],[1,0,1],[0,1,1]],
    H:[[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
    I:[[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
    J:[[0,1,1],[0,0,1],[0,0,1],[1,0,1],[0,1,0]],
    K:[[1,0,1],[1,1,0],[1,0,0],[1,1,0],[1,0,1]],
    L:[[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
    M:[[1,0,1],[1,1,1],[1,0,1],[1,0,1],[1,0,1]],
    N:[[1,0,1],[1,1,1],[1,1,1],[1,0,1],[1,0,1]],
    O:[[0,1,0],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
    P:[[1,1,0],[1,0,1],[1,1,0],[1,0,0],[1,0,0]],
    Q:[[0,1,0],[1,0,1],[1,0,1],[1,1,1],[0,1,1]],
    R:[[1,1,0],[1,0,1],[1,1,0],[1,1,0],[1,0,1]],
    S:[[0,1,1],[1,0,0],[0,1,0],[0,0,1],[1,1,0]],
    T:[[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
    U:[[1,0,1],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
    V:[[1,0,1],[1,0,1],[1,0,1],[0,1,0],[0,1,0]],
    W:[[1,0,1],[1,0,1],[1,1,1],[1,1,1],[1,0,1]],
    X:[[1,0,1],[0,1,0],[0,1,0],[0,1,0],[1,0,1]],
    Y:[[1,0,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
    Z:[[1,1,1],[0,0,1],[0,1,0],[1,0,0],[1,1,1]],
    0:[[0,1,0],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
    1:[[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
    2:[[1,1,0],[0,0,1],[0,1,0],[1,0,0],[1,1,1]],
    3:[[1,1,0],[0,0,1],[0,1,0],[0,0,1],[1,1,0]],
    4:[[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
    5:[[1,1,1],[1,0,0],[1,1,0],[0,0,1],[1,1,0]],
    6:[[0,1,1],[1,0,0],[1,1,0],[1,0,1],[0,1,0]],
    7:[[1,1,1],[0,0,1],[0,1,0],[0,1,0],[0,1,0]],
    8:[[0,1,0],[1,0,1],[0,1,0],[1,0,1],[0,1,0]],
    9:[[0,1,0],[1,0,1],[0,1,1],[0,0,1],[1,1,0]],
    ":":[[0,0,0],[0,1,0],[0,0,0],[0,1,0],[0,0,0]],
    ".":[[0,0,0],[0,0,0],[0,0,0],[0,1,0],[0,0,0]],
    "-": [[0,0,0],[0,0,0],[1,1,1],[0,0,0],[0,0,0]],
    "!": [[0,1,0],[0,1,0],[0,1,0],[0,0,0],[0,1,0]],
    " ": [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]]
  };
  let cx = x;
  for (const ch of String(str).toUpperCase()) {
    const glyph = G[ch] || G[" "];
    for (let gy = 0; gy < glyph.length; gy++) {
      for (let gx = 0; gx < glyph[gy].length; gx++) {
        if (glyph[gy][gx]) px(cx + gx, y + gy, r, g, b);
      }
    }
    cx += 4;
  }
}

function setState(s) { ram[9].st = s; }
function saveCheckpoint() {
  ram[58].st = ram[11].st;
  ram[59].st = ram[12].st;
  ram[60].st = ram[16].st;
}
function restoreCheckpoint() {
  if (ram[60].st) {
    ram[11].st = ram[58].st;
    ram[12].st = ram[59].st;
    ram[16].st = ram[60].st;
  }
}

// --------------------------------------------------
// 2) WORLD DATA
// --------------------------------------------------
const worlds = {
  1: {
    name: "GLASS HARBOR",
    w: 24,
    h: 24,
    map: [
      "########################",
      "#S....#......#....#...E#",
      "#.##.#.#.####.#.##.#.### #",
      "#....#.#....#.#....#...#.#",
      "####.#.####.#.####.###.#.#",
      "#....#......#....#...#.#.#",
      "#.######.######.###.#.#.#.#",
      "#......#.#....#...#.#.#...#",
      "#.####.#.#.##.###.#.#.#####",
      "#.#..#.#.#..#...#.#.#.....#",
      "#.#K.#.#.##.###.#.#.#####.#",
      "#...#.#....#...#.#.#.....#.#",
      "###.#.######.#.#.#.#.###.#.#",
      "#...#........#.#...#...#.#.#",
      "#.##########.#.#####.#.#.#.#",
      "#.#........#.#.....#.#.#...#",
      "#.#.######.#.#####.#.#.#####",
      "#.#.#....#.#.....#.#.#.....#",
      "#.#.#.##.#.#####.#.#.#####.#",
      "#...#.#..#.....#.#.#.....#.#",
      "#.###.#.#######.#.#.#####.#.#",
      "#...#.#.....C...#...#...D...#",
      "#...#...............#.......#",
      "########################"
    ],
    sky: [18, 22, 40],
    floor: [16, 18, 20],
    wall: [40, 110, 220],
    accent: [255, 220, 0],
    enemyColor: [255, 80, 120]
  },
  2: {
    name: "MIRROR DISTRICT",
    w: 24,
    h: 24,
    map: [
      "########################",
      "#S....#.....#......#..E#",
      "#.##.#.#.###.#.####.#.###",
      "#....#.#...#.#....#.#...#",
      "####.#.###.#.####.#.###.#",
      "#....#.....#....#.#.....#",
      "#.######.######.#.#####.#",
      "#......#.#....#.#...#...#",
      "#.####.#.#.##.#.###.#.###",
      "#.#..#.#.#..#.#...#.#...#",
      "#.#K.#.#.##.#.###.#.###.#",
      "#...#.#....#.#...#.#.....#",
      "###.#.######.#.#.#.#####.#",
      "#...#........#.#...#.....#",
      "#.##########.#.#####.#.#.#",
      "#.#........#.#.....#.#.#.#",
      "#.#.######.#.#####.#.#.#.#",
      "#.#.#....#.#.....#.#.#...#",
      "#.#.#.##.#.#####.#.#.#####",
      "#...#.#..#.....#.#.#...D.#",
      "#.###.#.#######.#.#.#####.#",
      "#...#.#.....C...#...#.....#",
      "#...#...............#.....#",
      "########################"
    ],
    sky: [28, 16, 42],
    floor: [18, 14, 24],
    wall: [180, 80, 255],
    accent: [0, 255, 180],
    enemyColor: [80, 255, 160]
  },
  3: {
    name: "CROWN CORE",
    w: 24,
    h: 24,
    map: [
      "########################",
      "#S....#....#......#...E#",
      "#.##.#.#.##.#.####.#.###",
      "#....#.#....#....#.#...#",
      "####.#.####.####.#.###.#",
      "#....#......#....#.....#",
      "#.######.######.#####.#.#",
      "#......#.#....#...#...#.#",
      "#.####.#.#.##.#.###.###.#",
      "#.#..#.#.#..#.#...#...#.#",
      "#.#K.#.#.##.#.###.#.###.#",
      "#...#.#....#.#...#.#...#.#",
      "###.#.######.#.#.#.#.#.#.#",
      "#...#........#.#...#.#...#",
      "#.##########.#.#####.###.#",
      "#.#........#.#.....#...#.#",
      "#.#.######.#.#####.#.#.#.#",
      "#.#.#....#.#.....#.#.#...#",
      "#.#.#.##.#.#####.#.#.#####",
      "#...#.#..#.....#.#.#..D..#",
      "#.###.#.#######.#.#.#####.#",
      "#...#.#.....C...#...#.....#",
      "#...#...............#.....#",
      "########################"
    ],
    sky: [14, 18, 34],
    floor: [10, 10, 18],
    wall: [255, 190, 70],
    accent: [255, 255, 255],
    enemyColor: [255, 120, 40]
  }
};

function loadLevel(id) {
  const world = worlds[id];
  if (!world) return;
  ram[16].st = id;
  ram[17].st = 0;
  ram[18].st = 0;
  ram[33].st = 0;
  ram[36].st = 0;
  ram[39].st = 0;
  ram[42].st = 0;
  ram[45].st = 0;
  ram[54].st = 0;
  ram[57].st = 0;
  ram[62].st = 65;
  ram[14].st = 100;
  ram[15].st = 1.1;
  ram[11].st = 2.5;
  ram[12].st = 2.5;
  ram[13].st = 0;
  ram[22].st = 9.5; ram[23].st = 9.5; ram[24].st = 1;
  ram[25].st = 17.5; ram[26].st = 16.5; ram[27].st = -1;
  ram[28].st = 11.5; ram[29].st = 20.5; ram[30].st = 1;
  ram[31].st = 20.5; ram[32].st = 10.5;
  ram[34].st = 20.5; ram[35].st = 20.5;
  ram[37].st = 12.5; ram[38].st = 10.5;
  ram[40].st = 13.5; ram[41].st = 21.0;
  ram[43].st = 0;
  ram[44].st = 0;
  ram[46].st = 1;
  ram[47].st = 0;
  saveCheckpoint();
}

function tileAt(levelId, x, y) {
  const world = worlds[levelId];
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  if (!world || yi < 0 || yi >= world.map.length || xi < 0 || xi >= world.map[yi].length) return "#";
  return world.map[yi][xi];
}
function solidAt(levelId, x, y) {
  const t = tileAt(levelId, x, y);
  return t === "#" || t === "D";
}
function safeTile(levelId, x, y) {
  const t = tileAt(levelId, x, y);
  return t;
}

function tryMove(nx, ny) {
  const lvl = ram[16].st;
  const pxw = 0.28;
  const pyw = 0.28;
  const okX = !solidAt(lvl, nx + pxw, ram[12].st) && !solidAt(lvl, nx - pxw, ram[12].st) && !solidAt(lvl, nx + pxw, ram[12].st + pyw) && !solidAt(lvl, nx - pxw, ram[12].st + pyw);
  const okY = !solidAt(lvl, ram[11].st + pxw, ny) && !solidAt(lvl, ram[11].st - pxw, ny) && !solidAt(lvl, ram[11].st + pxw, ny + pyw) && !solidAt(lvl, ram[11].st - pxw, ny + pyw);
  if (okX) ram[11].st = nx;
  if (okY) ram[12].st = ny;
  return okX && okY;
}

function updateEnemies() {
  const lvl = ram[16].st;
  const speed = lvl === 1 ? 0.02 : lvl === 2 ? 0.03 : 0.035;
  const world = worlds[lvl];
  function patrol(xi, yi, dir, minX, maxX, minY, maxY) {
    let nx = xi, ny = yi, nd = dir;
    if (dir === 1) nx += speed;
    if (dir === -1) nx -= speed;
    if (dir === 2) ny += speed;
    if (dir === -2) ny -= speed;
    if (nx < minX || nx > maxX || ny < minY || ny > maxY || solidAt(lvl, nx, ny)) nd *= -1;
    return [clamp(nx, 1.2, 22.8), clamp(ny, 1.2, 22.8), nd];
  }
  [ram[22].st, ram[23].st, ram[24].st] = patrol(ram[22].st, ram[23].st, ram[24].st, 2, 20, 2, 20);
  [ram[25].st, ram[26].st, ram[27].st] = patrol(ram[25].st, ram[26].st, ram[27].st, 3, 21, 3, 21);
  [ram[28].st, ram[29].st, ram[30].st] = patrol(ram[28].st, ram[29].st, ram[30].st, 2, 21, 2, 21);
}

function hitEnemy(ex, ey) {
  return dist2(ram[11].st, ram[12].st, ex, ey) < 0.42 * 0.42;
}

function castRay(angDeg, levelId) {
  const world = worlds[levelId];
  const rad = angToRad(angDeg);
  let rayX = ram[11].st;
  let rayY = ram[12].st;
  let step = 0;
  let tile = "#";
  let hitX = rayX;
  let hitY = rayY;
  const sx = Math.cos(rad) * 0.04;
  const sy = Math.sin(rad) * 0.04;
  for (let i = 0; i < 320; i++) {
    rayX += sx;
    rayY += sy;
    step += 1;
    tile = tileAt(levelId, rayX, rayY);
    if (tile === "#" || tile === "D") {
      hitX = rayX;
      hitY = rayY;
      break;
    }
  }
  const dx = hitX - ram[11].st;
  const dy = hitY - ram[12].st;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return { dist, tile, hitX, hitY };
}

function drawRayWorld(levelId) {
  const world = worlds[levelId];
  const sky = world.sky;
  const floor = world.floor;
  const wall = world.wall;
  const accent = world.accent;

  // Sky / floor
  for (let y = 0; y < 48; y++) {
    const t = y / 47;
    const r = Math.floor(sky[0] * (1 - t) + 10 * t);
    const g = Math.floor(sky[1] * (1 - t) + 10 * t);
    const b = Math.floor(sky[2] * (1 - t) + 20 * t);
    rect(0, y, 127, y, r, g, b);
  }
  for (let y = 48; y < 96; y++) {
    const t = (y - 48) / 47;
    const r = Math.floor(floor[0] * (1 - t) + 0 * t);
    const g = Math.floor(floor[1] * (1 - t) + 0 * t);
    const b = Math.floor(floor[2] * (1 - t) + 0 * t);
    rect(0, y, 127, y, r, g, b);
  }

  // Decorative horizon bands
  rect(0, 45, 127, 47, 0, 0, 0);
  rect(0, 46, 127, 46, accent[0] / 4, accent[1] / 4, accent[2] / 4);

  const fov = 65;
  const columns = 128;
  const angStart = ram[13].st - fov / 2;
  const fogBase = levelId === 1 ? [10, 12, 18] : levelId === 2 ? [16, 10, 20] : [10, 10, 14];

  for (let x = 0; x < columns; x++) {
    const a = angleWrap(angStart + (x / columns) * fov);
    const ray = castRay(a, levelId);
    const corrected = Math.max(0.0001, ray.dist * Math.cos(angToRad(angleWrap(a - ram[13].st))));
    const wallH = clamp(Math.floor(120 / corrected), 1, 96);
    const top = Math.floor(48 - wallH / 2);
    const bottom = Math.floor(48 + wallH / 2);
    const shade = clamp(Math.floor(255 - corrected * 24), 30, 255);
    const rr = Math.floor(wall[0] * shade / 255);
    const gg = Math.floor(wall[1] * shade / 255);
    const bb = Math.floor(wall[2] * shade / 255);
    rect(x, top, x, bottom, rr, gg, bb);

    // edge darkening for depth
    if (x % 4 === 0) {
      rect(x, top, x, bottom, Math.floor(rr * 0.8), Math.floor(gg * 0.8), Math.floor(bb * 0.8));
    }

    // tiny neon scanlines
    if (bottom > 48) {
      rect(x, bottom + 1, x, Math.min(95, bottom + 1), Math.min(255, accent[0]), Math.min(255, accent[1]), Math.min(255, accent[2]));
    }
  }

  // Floor lights / mist
  for (let i = 0; i < 28; i++) {
    const fx = (i * 17 + ram[8].st) % 128;
    const fy = 58 + (i % 5) * 7;
    px(fx, fy, fogBase[0] + i, fogBase[1] + i / 2, fogBase[2] + i / 3);
  }
}

function billboardSprite(wx, wy, bodyR, bodyG, bodyB, accentR, accentG, accentB, kind) {
  const dx = wx - ram[11].st;
  const dy = wy - ram[12].st;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const ang = Math.atan2(dy, dx) * 180 / Math.PI;
  let rel = angleWrap(ang - ram[13].st);
  if (rel > 180) rel -= 360;
  const screenX = Math.floor((rel + 32.5) / 65 * 128);
  const size = clamp(Math.floor(30 / Math.max(0.35, dist)), 2, 30);
  const cx = screenX;
  const cy = 48;
  const left = Math.floor(cx - size / 2);
  const right = Math.floor(cx + size / 2);
  const top = Math.floor(cy - size / 2);
  const bottom = Math.floor(cy + size / 2);
  if (right < 0 || left >= 128 || bottom < 0 || top >= 96) return;

  // body
  rect(left, top, right, bottom, bodyR, bodyG, bodyB);
  // face / highlight
  const blink = (Math.floor(ram[8].st / 8) % 2) === 0;
  if (kind === "enemy") {
    rect(left + 2, top + 2, right - 2, bottom - 2, accentR, accentG, accentB);
    if (blink) {
      px(left + 4, top + 5, 0, 0, 0);
      px(right - 4, top + 5, 0, 0, 0);
    }
    px(Math.floor((left + right) / 2), bottom - 3, 255, 255, 255);
  } else if (kind === "relic") {
    rect(left + 2, top + 2, right - 2, bottom - 2, accentR, accentG, accentB);
    px(cx, top + 3, 255, 255, 255);
    px(cx, bottom - 3, 255, 255, 255);
  } else if (kind === "companion") {
    rect(left + 2, top + 2, right - 2, bottom - 2, accentR, accentG, accentB);
    px(left + 4, top + 4, 255, 255, 255);
    px(right - 4, top + 4, 255, 255, 255);
  } else if (kind === "door") {
    rect(left + 2, top + 1, right - 2, bottom - 2, accentR, accentG, accentB);
    rect(left + 4, top + 4, right - 4, bottom - 4, 20, 20, 20);
  } else if (kind === "terminal") {
    rect(left + 1, top + 1, right - 1, bottom - 1, accentR, accentG, accentB);
    px(cx, top + 2, 255, 255, 255);
  }
}

function drawLevelUI(levelId) {
  const world = worlds[levelId];
  rect(0, 0, 127, 7, 0, 0, 0);
  tinyText("PRISMVault", 2, 1, 255, 255, 255);
  tinyText("LV", 52, 1, 255, 255, 255);
  tinyText(String(levelId), 62, 1, 255, 220, 0);
  tinyText("KEYS", 70, 1, 255, 255, 255);
  tinyText(String(ram[17].st), 90, 1, 255, 220, 0);
  tinyText("HP", 100, 1, 255, 255, 255);
  tinyText(String(ram[14].st), 110, 1, 255, 80, 120);
  if (ram[43].st > 0) {
    rect(0, 90, 127, 95, 0, 0, 0);
    tinyText("HIT!", 56, 91, 255, 80, 80);
  }
}

function drawMap() {
  clearScreen(8, 10, 20);
  for (let y = 0; y < 96; y++) {
    const c = 10 + Math.floor(10 * Math.sin((y + ram[8].st) * 0.12));
    rect(0, y, 127, y, 8 + c, 10 + c, 18 + c);
  }
  rect(10, 12, 118, 82, 12, 16, 28);
  outline(10, 12, 118, 82, 90, 120, 180);
  tinyText("WORLD MAP", 46, 16, 255, 255, 255);

  const nodes = [
    {x:24, y:40, lvl:1, name:"GLASS HARBOR"},
    {x:64, y:40, lvl:2, name:"MIRROR DISTRICT"},
    {x:102, y:40, lvl:3, name:"CROWN CORE"}
  ];
  rect(24, 42, 102, 43, 80, 80, 100);
  for (const n of nodes) {
    const done = ram[19 + (n.lvl - 1)].st;
    const col = done ? [0, 255, 150] : [255, 90, 90];
    rect(n.x - 4, n.y - 4, n.x + 4, n.y + 4, col[0], col[1], col[2]);
    outline(n.x - 5, n.y - 5, n.x + 5, n.y + 5, 255, 255, 255);
  }
  const cursor = nodes[ram[46].st - 1] || nodes[0];
  outline(cursor.x - 7, cursor.y - 7, cursor.x + 7, cursor.y + 7, 0, 255, 255);
  tinyText(nodes[ram[46].st - 1].name, 18, 58, 255, 220, 0);
  tinyText("A TO ENTER", 46, 72, 255, 255, 255);
  tinyText("LEFT RIGHT SELECT", 22, 78, 170, 220, 255);
  tinyText("START FOR STORY", 32, 84, 170, 220, 255);
}

function drawStory(title, line1, line2, line3) {
  clearScreen(8, 8, 16);
  for (let y = 0; y < 96; y++) {
    const t = Math.floor(10 + 10 * Math.sin((ram[8].st + y) * 0.08));
    rect(0, y, 127, y, 8 + t, 8 + t / 2, 16 + t);
  }
  rect(8, 10, 119, 86, 12, 12, 20);
  outline(8, 10, 119, 86, 255, 220, 0);
  drawPanelArt();
  tinyText(title, 32, 16, 255, 255, 255);
  tinyText(line1, 14, 54, 255, 255, 255);
  tinyText(line2, 14, 62, 255, 220, 0);
  tinyText(line3, 14, 70, 170, 220, 255);
  tinyText("START / A", 48, 80, 255, 255, 255);
}

function drawPanelArt() {
  // animated title emblem / brand mark
  const pulse = 120 + Math.floor(110 * Math.sin(ram[8].st * 0.15));
  rect(96, 18, 112, 34, 255, pulse, 0);
  rect(100, 22, 108, 30, 20, 20, 28);
  for (let i = 0; i < 8; i++) {
    px(96 + i, 18 + i / 2, 255, 255, 255);
    px(111 - i, 18 + i / 2, 255, 255, 255);
  }
}

function resetToMenu() {
  ram[10].st = 1;
  ram[46].st = 1;
  setState(0);
}

// --------------------------------------------------
// 3) GAME LOOP
// --------------------------------------------------
loadLevel(1);
setState(0);
ram[10].st = 1;
ram[14].st = 100;
ram[55].st = 0;
ram[47].st = 0;

currentGameLoop = setInterval(function () {
  ram[8].st++;
  ram[47].st = (Math.floor(ram[8].st / 18) % 2);

  const a = !!ram[0].st, s = !!ram[6].st, l = !!ram[4].st, r = !!ram[5].st, u = !!ram[2].st, d = !!ram[3].st;
  const aJ = a && !ram[48].st;
  const sJ = s && !ram[49].st;
  const lJ = l && !ram[50].st;
  const rJ = r && !ram[51].st;
  const uJ = u && !ram[52].st;
  const dJ = d && !ram[53].st;
  ram[48].st = a ? 1 : 0;
  ram[49].st = s ? 1 : 0;
  ram[50].st = l ? 1 : 0;
  ram[51].st = r ? 1 : 0;
  ram[52].st = u ? 1 : 0;
  ram[53].st = d ? 1 : 0;

  // movement / aim
  if (ram[9].st >= 11 && ram[9].st <= 13) {
    if (l) ram[13].st = angleWrap(ram[13].st - 3);
    if (r) ram[13].st = angleWrap(ram[13].st + 3);
    const moveSpeed = isPressed(1) ? 0.06 : 0.035;
    const rad = angToRad(ram[13].st);
    let nx = ram[11].st;
    let ny = ram[12].st;
    if (u) { nx += Math.cos(rad) * moveSpeed; ny += Math.sin(rad) * moveSpeed; }
    if (d) { nx -= Math.cos(rad) * moveSpeed; ny -= Math.sin(rad) * moveSpeed; }
    tryMove(nx, ny);

    // interact / use
    if (aJ) {
      const t = tileAt(ram[16].st, ram[11].st, ram[12].st);
      if (t === "K") {
        ram[17].st++;
        ram[55].st += 30;
      }
      if (t === "C") {
        ram[42].st = 1;
        ram[55].st += 80;
        ram[57].st = 1;
      }
      if (t === "D" && ram[18].st) {
        if (ram[16].st === 1) ram[19].st = 1;
        if (ram[16].st === 2) ram[20].st = 1;
        if (ram[16].st === 3) ram[21].st = 1;
        if (ram[16].st < 3) {
          setState(3);
        } else {
          setState(7);
          ram[45].st = 1;
        }
      }
      if (t === "S") {
        saveCheckpoint();
        ram[55].st += 20;
      }
      if (t === "E") {
        // exit/goal tile can be stepped on only after key / objective
        if (ram[16].st === 1 && ram[17].st >= 1) { ram[19].st = 1; setState(3); }
        if (ram[16].st === 2 && ram[17].st >= 1) { ram[20].st = 1; setState(3); }
        if (ram[16].st === 3 && ram[42].st) { ram[21].st = 1; setState(7); }
      }
    }

    updateEnemies();

    if (ram[43].st > 0) ram[43].st--;
    const danger = hitEnemy(ram[22].st, ram[23].st) || hitEnemy(ram[25].st, ram[26].st) || hitEnemy(ram[28].st, ram[29].st);
    if (danger && ram[43].st <= 0) {
      ram[14].st -= 15;
      ram[55].st = Math.max(0, ram[55].st - 20);
      ram[43].st = 20;
      restoreCheckpoint();
      if (ram[14].st <= 0) setState(5);
    }

    // objective completion / gate open
    if (ram[16].st === 1 && ram[17].st >= 1) ram[18].st = 1;
    if (ram[16].st === 2 && ram[17].st >= 1) ram[18].st = 1;
    if (ram[16].st === 3 && ram[42].st) ram[18].st = 1;

    // render level
    drawRayWorld(ram[16].st);
    // sprites drawn after walls so they appear in front
    billboardSprite(ram[22].st, ram[23].st, 255, 60, 120, 255, 220, 0, "enemy");
    billboardSprite(ram[25].st, ram[26].st, 80, 255, 160, 0, 255, 180, "enemy");
    billboardSprite(ram[28].st, ram[29].st, 255, 120, 60, 255, 255, 0, "enemy");
    billboardSprite(ram[31].st, ram[32].st, 255, 220, 0, 255, 255, 255, "relic");
    billboardSprite(ram[34].st, ram[35].st, 30, 255, 160, 255, 255, 255, "door");
    billboardSprite(ram[37].st, ram[38].st, 0, 190, 255, 255, 255, 255, "terminal");
    billboardSprite(ram[40].st, ram[41].st, 90, 220, 255, 255, 255, 255, "companion");
    drawLevelUI(ram[16].st);
  }

  // title
  else if (ram[9].st === 0) {
    clearScreen(8, 10, 20);
    for (let y = 0; y < 96; y++) {
      const c = 8 + Math.floor(12 * Math.sin((y + ram[8].st) * 0.08));
      rect(0, y, 127, y, 8 + c, 10 + c / 2, 20 + c);
    }
    drawPanelArt();
    tinyText("NEON DEPTHS", 28, 16, 255, 255, 255);
    tinyText("A PRISMVault STORY", 18, 24, 255, 220, 0);
    tinyText("A TO START", 44, 74, 255, 255, 255);
    tinyText("START FOR MAP", 35, 82, 170, 220, 255);
    if (aJ || sJ) {
      setState(1);
    }
  }

  // opening story
  else if (ram[9].st === 1) {
    drawStory(
      "CHAPTER 1",
      "THE STICKER RELIC IS MISSING",
      "A CITY OF LIGHTS HIDES THE PATH",
      "GET READY TO ENTER GLASS HARBOR"
    );
    if (aJ || sJ) { setState(10); ram[46].st = 1; }
  }
  else if (ram[9].st === 2) {
    drawStory(
      "CHAPTER 2",
      "MIRRORS ARE LYING TO YOU",
      "THE DISTRICT SHIFTS WHEN YOU LOOK AWAY",
      "FIND THE KEY AND KEEP MOVING"
    );
    if (aJ || sJ) { setState(10); ram[46].st = 2; }
  }
  else if (ram[9].st === 3) {
    clearScreen(6, 24, 12);
    rect(20, 20, 108, 76, 0, 40, 16);
    outline(20, 20, 108, 76, 0, 255, 140);
    tinyText("LEVEL COMPLETE", 28, 28, 255, 255, 255);
    tinyText("THE DOOR UNLOCKED", 24, 38, 255, 220, 0);
    tinyText("A TO CONTINUE", 32, 66, 255, 255, 255);
    if (aJ || sJ) {
      if (ram[16].st === 1) { ram[46].st = 2; setState(2); }
      else if (ram[16].st === 2) { ram[46].st = 3; setState(4); }
      else { setState(10); }
    }
  }
  else if (ram[9].st === 4) {
    drawStory(
      "CHAPTER 3",
      "THE CROWN CORE WAITS BELOW",
      "THE COMPANION IS TRAPPED INSIDE",
      "ONLY THE FINAL DOOR ENDS THIS"
    );
    if (aJ || sJ) { setState(10); ram[46].st = 3; }
  }
  else if (ram[9].st === 5) {
    clearScreen(40, 0, 8);
    rect(18, 16, 110, 80, 0, 0, 0);
    outline(18, 16, 110, 80, 255, 80, 120);
    tinyText("GAME OVER", 36, 28, 255, 255, 255);
    tinyText("THE CITY WON THIS TIME", 18, 42, 255, 220, 0);
    tinyText("A TO RETRY", 44, 66, 255, 255, 255);
    if (aJ || sJ) { loadLevel(ram[16].st || 1); setState(10); ram[46].st = 1; }
  }
  else if (ram[9].st === 6) {
    drawStory(
      "THE FINAL LOCK",
      "ALL THREE PATHS ARE OPEN",
      "A LAST JOURNEY THROUGH THE CORE",
      "THE RELIC WILL DECIDE THE END"
    );
    if (aJ || sJ) { setState(10); ram[46].st = 3; }
  }
  else if (ram[9].st === 7) {
    clearScreen(2, 10, 20);
    for (let y = 0; y < 96; y++) {
      const c = 15 + Math.floor(20 * Math.sin((y + ram[8].st) * 0.1));
      rect(0, y, 127, y, 2 + c / 4, 10 + c / 4, 20 + c / 2);
    }
    rect(16, 14, 112, 82, 10, 10, 18);
    outline(16, 14, 112, 82, 255, 220, 0);
    drawPanelArt();
    tinyText("PRISMVault", 42, 18, 255, 255, 255);
    tinyText("NEON DEPTHS COMPLETE", 20, 30, 255, 220, 0);
    tinyText("SCORE", 50, 48, 255, 255, 255);
    tinyText(String(ram[55].st), 72, 48, 255, 220, 0);
    tinyText("THE RELIC RETURNS HOME", 14, 64, 255, 255, 255);
    tinyText("START FOR MAP", 36, 74, 170, 220, 255);
    if (aJ || sJ) { resetToMenu(); }
  }
  else if (ram[9].st === 10) {
    drawMap();
    if (lJ && ram[46].st > 1) ram[46].st--;
    if (rJ && ram[46].st < 3) ram[46].st++;
    if (aJ || sJ) {
      if (ram[46].st === 1) { loadLevel(1); setState(11); }
      if (ram[46].st === 2) { loadLevel(2); setState(12); }
      if (ram[46].st === 3) { loadLevel(3); setState(13); }
    }
  }

  // level gameplay wrappers
  else if (ram[9].st === 11 || ram[9].st === 12 || ram[9].st === 13) {
    const lvl = ram[9].st - 10;
    drawRayWorld(lvl);
    updateEnemies();

    // Controls in gameplay are same as above, but this branch ensures the ROM still renders if state is set directly.
    if (isPressed(4)) ram[13].st = angleWrap(ram[13].st - 3);
    if (isPressed(5)) ram[13].st = angleWrap(ram[13].st + 3);
    const ms = isPressed(1) ? 0.06 : 0.035;
    const rad = angToRad(ram[13].st);
    let nx = ram[11].st;
    let ny = ram[12].st;
    if (isPressed(2)) { nx += Math.cos(rad) * ms; ny += Math.sin(rad) * ms; }
    if (isPressed(3)) { nx -= Math.cos(rad) * ms; ny -= Math.sin(rad) * ms; }
    tryMove(nx, ny);

    // collisions & goal state
    if (ram[43].st > 0) ram[43].st--;
    const hit = hitEnemy(ram[22].st, ram[23].st) || hitEnemy(ram[25].st, ram[26].st) || hitEnemy(ram[28].st, ram[29].st);
    if (hit && ram[43].st <= 0) {
      ram[14].st -= 15;
      ram[43].st = 20;
      restoreCheckpoint();
      if (ram[14].st <= 0) setState(5);
    }

    // objective collection
    if (!ram[33].st && dist2(ram[11].st, ram[12].st, ram[31].st, ram[32].st) < 0.55 * 0.55) {
      ram[33].st = 1;
      ram[55].st += 100;
      ram[17].st += 1;
    }
    if (!ram[39].st && dist2(ram[11].st, ram[12].st, ram[37].st, ram[38].st) < 0.55 * 0.55) {
      ram[39].st = 1;
      ram[18].st = 1;
      ram[17].st += 1;
      ram[55].st += 50;
    }
    if (!ram[42].st && dist2(ram[11].st, ram[12].st, ram[40].st, ram[41].st) < 0.55 * 0.55) {
      ram[42].st = 1;
      ram[55].st += 200;
      ram[57].st = 1;
    }

    // gate open / exit
    const t = safeTile(lvl, ram[11].st, ram[12].st);
    if (t === "E" && (ram[33].st || lvl !== 1)) {
      if (lvl === 1) ram[19].st = 1;
      if (lvl === 2) ram[20].st = 1;
      if (lvl === 3) ram[21].st = 1;
      if (lvl < 3) {
        setState(3);
        saveCheckpoint();
      } else {
        setState(7);
      }
    }

    // checkpoint tile
    if (t === "S") saveCheckpoint();
    // relic tile hint / story beat
    if (t === "K") ram[55].st += 1;
    if (t === "C") ram[54].st = 1;

    drawLevelUI(lvl);
    billboardSprite(ram[22].st, ram[23].st, 255, 80, 120, 255, 220, 0, "enemy");
    billboardSprite(ram[25].st, ram[26].st, 80, 255, 160, 0, 255, 180, "enemy");
    billboardSprite(ram[28].st, ram[29].st, 255, 120, 60, 255, 255, 0, "enemy");
    billboardSprite(ram[31].st, ram[32].st, 255, 220, 0, 255, 255, 255, "relic");
    billboardSprite(ram[34].st, ram[35].st, 30, 255, 160, 255, 255, 255, "door");
    billboardSprite(ram[37].st, ram[38].st, 0, 190, 255, 255, 255, 255, "terminal");
    billboardSprite(ram[40].st, ram[41].st, 90, 220, 255, 255, 255, 255, "companion");
  }

  // a simple static pause if something weird happens
  if (ram[9].st === 99) {
    clearScreen(0, 0, 0);
    tinyText("PAUSE", 54, 44, 255, 255, 255);
  }

}, 50);
