// Top-Down Story ROM for the custom RAM/VRAM engine
// Save as rom.js (or paste into your ROM loader path)
// Design goals:
// - Uses RAM variables for game state
// - Multiple levels
// - Story screens
// - Simple animated sprites
// - Top-down gameplay
// - High-resolution VRAM (96x96)

// --------------------------------------------------
// 0) SAFETY / RESET
// --------------------------------------------------
if (typeof currentGameLoop !== "undefined" && currentGameLoop) {
  clearInterval(currentGameLoop);
  currentGameLoop = null;
}

// Rebuild a higher-res VRAM if the engine functions depend on it.
vram.length = 0;
for (let y = 0; y < 96; y++) {
  const row = [];
  for (let x = 0; x < 96; x++) row.push([0, 0, 0]);
  vram.push(row);
}

// --------------------------------------------------
// 1) RAM MAP
// --------------------------------------------------
//  0 A button
//  1 B button
//  2 Up
//  3 Down
//  4 Left
//  5 Right
//  6 Start
//  7 Select
//  8 Frame timer
//  9 Game state
// 10 Menu choice / story page / level select
// 11 Player X
// 12 Player Y
// 13 Player direction (0 down, 1 left, 2 right, 3 up)
// 14 Player animation frame
// 15 Player movement cooldown
// 16 Current level
// 17 Key count
// 18 Gate open flag
// 19 Enemy 1 X
// 20 Enemy 1 Y
// 21 Enemy 1 dir
// 22 Enemy 2 X
// 23 Enemy 2 Y
// 24 Enemy 2 dir
// 25 Story / objective progress
// 26 Level 1 cleared
// 27 Level 2 cleared
// 28 Level 3 cleared
// 29 Cutscene timer
// 30 Talk / message index
// 31 Beacon X
// 32 Beacon Y
// 33 Beacon collected flag
// 34 Door X
// 35 Door Y
// 36 Door open anim
// 37 Item X
// 38 Item Y
// 39 Item collected flag
// 40 Companion X
// 41 Companion Y
// 42 Companion anim
// 43 Damage / invincibility timer
// 44 Ending flag
// 45 Level transition timer
// 46 Map cursor
// 47 Title blink
// 48 Dialogue advance edge
// 49 Last A
// 50 Last Start
// 51 Last Left
// 52 Last Right
// 53 Last Up
// 54 Last Down
// 55 World theme
// 56 Score
// 57 Secret found
// 58 Checkpoint X
// 59 Checkpoint Y
// 60 Checkpoint valid
// 61 Enemy 3 X
// 62 Enemy 3 Y
// 63 Enemy 3 dir

for (let i = 0; i < 64; i++) {
  if (!ram[i]) ram[i] = { st: 0 };
  if (typeof ram[i].st !== "number" && typeof ram[i].st !== "boolean") ram[i].st = 0;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rnd(n) { return Math.floor(Math.random() * n); }
function isPressed(idx) { return !!ram[idx].st; }
function justPressed(idx, lastIdx) { return !!ram[idx].st && !!!ram[lastIdx].st; }
function setPixel(x, y, r, g, b) {
  if (y >= 0 && y < vram.length && x >= 0 && x < vram[0].length) {
    vram[y][x] = [r, g, b];
  }
}
function fillRect(x1, y1, x2, y2, r, g, b) {
  const ax = Math.max(0, Math.floor(Math.min(x1, x2)));
  const ay = Math.max(0, Math.floor(Math.min(y1, y2)));
  const bx = Math.min(vram[0].length - 1, Math.floor(Math.max(x1, x2)));
  const by = Math.min(vram.length - 1, Math.floor(Math.max(y1, y2)));
  for (let y = ay; y <= by; y++) {
    for (let x = ax; x <= bx; x++) {
      vram[y][x] = [r, g, b];
    }
  }
}
function clearScreen(r, g, b) { fillRect(0, 0, 95, 95, r, g, b); }
function drawOutline(x1, y1, x2, y2, r, g, b) {
  fillRect(x1, y1, x2, y1, r, g, b);
  fillRect(x1, y2, x2, y2, r, g, b);
  fillRect(x1, y1, x1, y2, r, g, b);
  fillRect(x2, y1, x2, y2, r, g, b);
}
function drawDiamond(cx, cy, s, r, g, b) {
  for (let y = -s; y <= s; y++) {
    const w = s - Math.abs(y);
    fillRect(cx - w, cy + y, cx + w, cy + y, r, g, b);
  }
}
function drawSpeechBox() {
  fillRect(6, 74, 89, 92, 10, 10, 18);
  drawOutline(6, 74, 89, 92, 80, 120, 180);
}
function drawTextLike(text, x, y, r, g, b) {
  // tiny block-font; enough for mood + readable labels
  const map = {
    A:[[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
    B:[[1,1,0],[1,1,1],[1,1,0],[1,1,1]],
    C:[[1,1,1],[1,0,0],[1,0,0],[1,1,1]],
    D:[[1,1,0],[1,0,1],[1,0,1],[1,1,0]],
    E:[[1,1,1],[1,1,0],[1,1,0],[1,1,1]],
    F:[[1,1,1],[1,1,0],[1,1,0],[1,0,0]],
    G:[[1,1,1],[1,0,0],[1,0,1],[1,1,1]],
    H:[[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
    I:[[1,1,1],[0,1,0],[0,1,0],[1,1,1]],
    J:[[0,1,1],[0,0,1],[1,0,1],[1,1,1]],
    K:[[1,0,1],[1,1,0],[1,1,0],[1,0,1]],
    L:[[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
    M:[[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
    N:[[1,0,1],[1,1,1],[1,1,1],[1,0,1]],
    O:[[1,1,1],[1,0,1],[1,0,1],[1,1,1]],
    P:[[1,1,1],[1,1,1],[1,1,0],[1,0,0]],
    Q:[[1,1,1],[1,0,1],[1,1,1],[0,0,1]],
    R:[[1,1,1],[1,1,1],[1,1,0],[1,0,1]],
    S:[[1,1,1],[1,1,0],[0,1,1],[1,1,1]],
    T:[[1,1,1],[0,1,0],[0,1,0],[0,1,0]],
    U:[[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    V:[[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
    W:[[1,0,1],[1,0,1],[1,1,1],[1,0,1]],
    X:[[1,0,1],[0,1,0],[0,1,0],[1,0,1]],
    Y:[[1,0,1],[0,1,0],[0,1,0],[0,1,0]],
    Z:[[1,1,1],[0,0,1],[0,1,0],[1,1,1]],
    0:[[1,1,1],[1,0,1],[1,0,1],[1,1,1]],
    1:[[0,1,0],[1,1,0],[0,1,0],[1,1,1]],
    2:[[1,1,1],[0,0,1],[1,1,1],[1,1,1]],
    3:[[1,1,1],[0,0,1],[0,1,1],[1,1,1]],
    4:[[1,0,1],[1,0,1],[1,1,1],[0,0,1]],
    5:[[1,1,1],[1,1,0],[0,0,1],[1,1,1]],
    6:[[1,1,1],[1,1,0],[1,0,1],[1,1,1]],
    7:[[1,1,1],[0,0,1],[0,1,0],[0,1,0]],
    8:[[1,1,1],[1,1,1],[1,0,1],[1,1,1]],
    9:[[1,1,1],[1,0,1],[0,0,1],[1,1,1]],
    " ": [[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
    ":": [[0,0,0],[0,1,0],[0,0,0],[0,1,0]],
    "!": [[0,1,0],[0,1,0],[0,0,0],[0,1,0]],
    ".": [[0,0,0],[0,0,0],[0,0,0],[0,1,0]],
    "-": [[0,0,0],[1,1,1],[0,0,0],[0,0,0]],
    "?": [[1,1,1],[0,0,1],[0,1,0],[0,1,0]]
  };
  let px = x;
  for (const ch of String(text).toUpperCase()) {
    const glyph = map[ch] || map["?"];
    for (let gy = 0; gy < glyph.length; gy++) {
      for (let gx = 0; gx < glyph[gy].length; gx++) {
        if (glyph[gy][gx]) setPixel(px + gx, y + gy, r, g, b);
      }
    }
    px += 5;
  }
}

function resetLevel(level) {
  ram[16].st = level;
  ram[17].st = 0;
  ram[18].st = 0;
  ram[25].st = 0;
  ram[29].st = 0;
  ram[33].st = 0;
  ram[39].st = 0;
  ram[43].st = 0;
  ram[45].st = 0;
  ram[60].st = 0;
  ram[11].st = 10;
  ram[12].st = 10;
  ram[13].st = 0;
  ram[14].st = 0;
  ram[15].st = 0;
  ram[19].st = 70;
  ram[20].st = 26;
  ram[21].st = 1;
  ram[22].st = 40;
  ram[23].st = 68;
  ram[24].st = -1;
  ram[31].st = 80;
  ram[32].st = 20;
  ram[34].st = 84;
  ram[35].st = 84;
  ram[37].st = 20;
  ram[38].st = 20;
  ram[40].st = 14;
  ram[41].st = 72;
  ram[42].st = 0;
  ram[58].st = 10;
  ram[59].st = 10;
  if (level === 1) {
    ram[31].st = 80; ram[32].st = 20; ram[34].st = 84; ram[35].st = 84; ram[37].st = 18; ram[38].st = 18;
    ram[19].st = 64; ram[20].st = 24; ram[21].st = 1;
    ram[22].st = 40; ram[23].st = 68; ram[24].st = -1;
    ram[58].st = 10; ram[59].st = 10;
  } else if (level === 2) {
    ram[31].st = 82; ram[32].st = 82; ram[34].st = 86; ram[35].st = 12; ram[37].st = 48; ram[38].st = 18;
    ram[19].st = 20; ram[20].st = 40; ram[21].st = 1;
    ram[22].st = 78; ram[23].st = 52; ram[24].st = -1;
    ram[58].st = 10; ram[59].st = 80;
  } else if (level === 3) {
    ram[31].st = 48; ram[32].st = 48; ram[34].st = 86; ram[35].st = 86; ram[37].st = 10; ram[38].st = 78;
    ram[19].st = 66; ram[20].st = 16; ram[21].st = -1;
    ram[22].st = 50; ram[23].st = 82; ram[24].st = 1;
    ram[61].st = 10; ram[62].st = 50; ram[63].st = 1;
    ram[58].st = 8; ram[59].st = 86;
  }
}

function drawHero(x, y) {
  const anim = (Math.floor(ram[8].st / 8) + ram[14].st) % 2;
  // body
  fillRect(x + 1, y + 1, x + 4, y + 4, 30, 170, 255);
  fillRect(x + 2, y + 2, x + 3, y + 3, 255, 255, 255);
  // hat / hair / direction
  if (ram[13].st === 0) fillRect(x + 1, y, x + 4, y + 1, 10, 40, 160);
  if (ram[13].st === 1) fillRect(x, y + 1, x + 1, y + 4, 10, 40, 160);
  if (ram[13].st === 2) fillRect(x + 4, y + 1, x + 5, y + 4, 10, 40, 160);
  if (ram[13].st === 3) fillRect(x + 1, y + 4, x + 4, y + 5, 10, 40, 160);
  // feet animation
  if (anim === 0) {
    fillRect(x + 1, y + 5, x + 2, y + 5, 0, 80, 180);
    fillRect(x + 3, y + 5, x + 4, y + 5, 0, 80, 180);
  } else {
    fillRect(x, y + 5, x + 1, y + 5, 0, 80, 180);
    fillRect(x + 4, y + 5, x + 5, y + 5, 0, 80, 180);
  }
  // eyes
  if (ram[13].st === 0) {
    setPixel(x + 2, y + 2, 0, 0, 0);
    setPixel(x + 3, y + 2, 0, 0, 0);
  } else if (ram[13].st === 1) {
    setPixel(x + 1, y + 2, 0, 0, 0);
  } else if (ram[13].st === 2) {
    setPixel(x + 4, y + 2, 0, 0, 0);
  } else {
    setPixel(x + 2, y + 1, 0, 0, 0);
    setPixel(x + 3, y + 1, 0, 0, 0);
  }
}

function drawEnemy(x, y, colorA, colorB) {
  const blink = (Math.floor(ram[8].st / 6) % 2) === 0;
  fillRect(x, y, x + 5, y + 5, colorA[0], colorA[1], colorA[2]);
  fillRect(x + 1, y + 1, x + 4, y + 4, colorB[0], colorB[1], colorB[2]);
  if (blink) {
    setPixel(x + 1, y + 2, 255, 255, 255);
    setPixel(x + 4, y + 2, 255, 255, 255);
  } else {
    setPixel(x + 1, y + 2, 0, 0, 0);
    setPixel(x + 4, y + 2, 0, 0, 0);
  }
  setPixel(x + 2, y + 4, 0, 0, 0);
  setPixel(x + 3, y + 4, 0, 0, 0);
}

function drawMap() {
  clearScreen(12, 14, 26);
  for (let y = 0; y < 96; y += 6) fillRect(0, y, 95, y, 18, 20, 34);
  for (let x = 0; x < 96; x += 6) fillRect(x, 0, x, 95, 18, 20, 34);
  fillRect(8, 10, 88, 14, 50, 60, 100);
  fillRect(8, 82, 88, 86, 50, 60, 100);
  fillRect(10, 20, 14, 24, ram[26].st ? 0 : 255, ram[26].st ? 220 : 80, ram[26].st ? 120 : 60);
  fillRect(43, 20, 47, 24, ram[27].st ? 0 : 255, ram[27].st ? 220 : 80, ram[27].st ? 120 : 60);
  fillRect(76, 20, 80, 24, ram[28].st ? 0 : 255, ram[28].st ? 220 : 80, ram[28].st ? 120 : 60);
  fillRect(12, 22, 77, 22, 80, 80, 100);
  fillRect(14, 64, 78, 64, 80, 80, 100);

  const cx = ram[46].st;
  const nX = cx === 1 ? 8 : cx === 2 ? 41 : 74;
  drawOutline(nX, 18, nX + 6, 26, 0, 255, 255);
  drawTextLike("LEVEL", 14, 28, 180, 220, 255);
  drawTextLike(String(cx), 46, 28, 180, 220, 255);
  drawTextLike("A TO START", 28, 74, 255, 255, 255);
  drawTextLike("LEFT RIGHT SELECT", 12, 78, 140, 180, 220);

  const page = cx;
  if (page === 1) {
    drawTextLike("FOREST GATE", 22, 42, 255, 220, 0);
    drawTextLike("THE FIRST BEACON IS LOST", 9, 48, 255, 255, 255);
  } else if (page === 2) {
    drawTextLike("MIRROR CITY", 24, 42, 255, 220, 0);
    drawTextLike("FIND THE KEY TO OPEN THE DOOR", 7, 48, 255, 255, 255);
  } else {
    drawTextLike("CLOCK TOWER", 22, 42, 255, 220, 0);
    drawTextLike("SAVE THE COMPANION", 17, 48, 255, 255, 255);
  }
}

function drawStoryScreen(title, body1, body2) {
  clearScreen(8, 8, 16);
  drawDiamond(48, 26, 18, 255, 215, 0);
  drawDiamond(48, 26, 13, 35, 35, 50);
  drawTextLike(title, 20, 12, 255, 255, 255);
  drawTextLike(body1, 10, 54, 230, 230, 255);
  drawTextLike(body2, 10, 62, 230, 230, 255);
  drawTextLike("START", 38, 82, 255, 220, 0);
}

function drawLevel(level) {
  // Background theme
  if (level === 1) clearScreen(18, 28, 18);
  if (level === 2) clearScreen(20, 18, 30);
  if (level === 3) clearScreen(18, 22, 30);

  // Floor / walls
  for (let y = 0; y < 96; y += 8) {
    const shade = level === 1 ? 30 : level === 2 ? 36 : 28;
    fillRect(0, y, 95, y, shade, shade + 10, shade);
  }

  // Map obstacles / rooms
  if (level === 1) {
    fillRect(6, 6, 18, 34, 48, 80, 48);
    fillRect(28, 10, 36, 46, 60, 100, 60);
    fillRect(44, 20, 60, 28, 42, 70, 42);
    fillRect(66, 8, 84, 40, 35, 58, 35);
    fillRect(18, 50, 70, 58, 22, 50, 22);
  } else if (level === 2) {
    fillRect(6, 8, 28, 18, 60, 48, 76);
    fillRect(34, 8, 40, 54, 54, 40, 70);
    fillRect(48, 34, 82, 44, 60, 48, 76);
    fillRect(16, 60, 42, 72, 44, 30, 64);
    fillRect(50, 56, 86, 66, 44, 30, 64);
  } else {
    fillRect(10, 12, 28, 18, 40, 72, 90);
    fillRect(34, 12, 40, 76, 26, 50, 70);
    fillRect(46, 22, 82, 30, 40, 72, 90);
    fillRect(48, 52, 88, 60, 26, 50, 70);
    fillRect(14, 72, 70, 80, 40, 72, 90);
  }

  // Beacon / key / door / companion
  if (!ram[33].st) {
    drawDiamond(ram[31].st, ram[32].st, 3, 255, 220, 0);
    drawDiamond(ram[31].st, ram[32].st, 1, 255, 255, 255);
  }
  if (!ram[39].st) {
    fillRect(ram[37].st, ram[38].st, ram[37].st + 4, ram[38].st + 4, 220, 180, 0);
    fillRect(ram[37].st + 1, ram[38].st + 1, ram[37].st + 3, ram[38].st + 3, 60, 40, 0);
  }
  fillRect(ram[34].st, ram[35].st, ram[34].st + 5, ram[35].st + 7, ram[18].st ? 50 : 160, ram[18].st ? 220 : 60, 120);
  fillRect(ram[40].st, ram[41].st, ram[40].st + 4, ram[41].st + 5, 100, 220, 255);

  // Enemies
  const ex1 = ram[19].st, ey1 = ram[20].st;
  const ex2 = ram[22].st, ey2 = ram[23].st;
  drawEnemy(ex1, ey1, [160, 20, 60], [255, 90, 120]);
  drawEnemy(ex2, ey2, [30, 120, 50], [80, 255, 120]);
  if (level === 3) drawEnemy(ram[61].st, ram[62].st, [60, 50, 160], [150, 120, 255]);

  // Player + effect
  const px = ram[11].st;
  const py = ram[12].st;
  if (ram[43].st % 2 === 0) drawHero(px, py);

  // UI
  fillRect(2, 2, 93, 8, 8, 8, 14);
  drawOutline(2, 2, 93, 8, 90, 120, 180);
  drawTextLike("KEYS", 4, 3, 255, 255, 255);
  drawTextLike(String(ram[17].st), 28, 3, 255, 220, 0);
  drawTextLike("LV", 38, 3, 255, 255, 255);
  drawTextLike(String(level), 48, 3, 255, 220, 0);
  drawTextLike("SCORE", 58, 3, 255, 255, 255);
  drawTextLike(String(ram[56].st), 86, 3, 255, 220, 0);

  // Dialogue box in top/bottom moments
  if (ram[25].st > 0) {
    drawSpeechBox();
    if (level === 1) {
      drawTextLike("THE MAP SAID THE BEACON", 10, 78, 255, 255, 255);
      drawTextLike("IS HIDDEN IN THE GREEN GATES.", 10, 84, 255, 255, 255);
    } else if (level === 2) {
      drawTextLike("THE COMPANION IS WATCHING", 10, 78, 255, 255, 255);
      drawTextLike("FROM THE SHADOWS OF THE CITY.", 10, 84, 255, 255, 255);
    } else {
      drawTextLike("THE CLOCK TOWER IS FAILING.", 10, 78, 255, 255, 255);
      drawTextLike("REACH THE FINAL DOOR.", 10, 84, 255, 255, 255);
    }
  }
}

function moveEnemies() {
  // enemy 1
  if (ram[8].st % 2 === 0) {
    ram[19].st += ram[21].st;
    if (ram[19].st < 8 || ram[19].st > 84) ram[21].st *= -1;
  }
  // enemy 2
  if (ram[8].st % 3 === 0) {
    ram[22].st += ram[24].st;
    if (ram[22].st < 8 || ram[22].st > 84) ram[24].st *= -1;
  }
  // enemy 3
  if (ram[16].st === 3) {
    if (ram[8].st % 2 === 0) {
      ram[61].st += ram[63].st;
      if (ram[61].st < 8 || ram[61].st > 84) ram[63].st *= -1;
    }
  }
}

function rectHit(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function updateGameplay() {
  const level = ram[16].st;
  const pxSize = 6;
  const pySize = 6;

  // movement timer / invincibility
  if (ram[43].st > 0) ram[43].st--;
  if (ram[15].st > 0) ram[15].st--;
  if (ram[36].st > 0) ram[36].st--;
  if (ram[45].st > 0) ram[45].st--;

  // direction from controls
  if (isPressed(2)) ram[13].st = 3;
  else if (isPressed(3)) ram[13].st = 0;
  else if (isPressed(4)) ram[13].st = 1;
  else if (isPressed(5)) ram[13].st = 2;

  // player movement
  if (ram[15].st <= 0) {
    let dx = 0, dy = 0;
    if (isPressed(2)) dy -= 1;
    if (isPressed(3)) dy += 1;
    if (isPressed(4)) dx -= 1;
    if (isPressed(5)) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const speed = isPressed(1) ? 2 : 1;
      ram[11].st = clamp(ram[11].st + dx * speed, 4, 86);
      ram[12].st = clamp(ram[12].st + dy * speed, 10, 86);
      ram[14].st = (ram[14].st + 1) % 4;
    }
    ram[15].st = 2;
  }

  // level-specific invisible walls / boundaries
  if (level === 1) {
    if (ram[11].st > 18 && ram[11].st < 28 && ram[12].st < 32) ram[12].st = 32;
    if (ram[11].st > 62 && ram[12].st < 18) ram[11].st = 62;
  } else if (level === 2) {
    if (ram[12].st > 34 && ram[12].st < 46 && ram[11].st > 32 && ram[11].st < 44) ram[11].st = 32;
    if (ram[11].st > 50 && ram[11].st < 84 && ram[12].st > 52 && ram[12].st < 68) ram[12].st = 52;
  } else {
    if (ram[11].st > 30 && ram[11].st < 42 && ram[12].st > 10 && ram[12].st < 76) ram[11].st = 30;
  }

  // collect beacon
  if (!ram[33].st && rectHit(ram[11].st, ram[12].st, 6, 6, ram[31].st - 2, ram[32].st - 2, 6, 6)) {
    ram[33].st = 1;
    ram[17].st += 1;
    ram[56].st += 50;
    ram[25].st = 40;
  }

  // collect key
  if (!ram[39].st && rectHit(ram[11].st, ram[12].st, 6, 6, ram[37].st, ram[38].st, 5, 5)) {
    ram[39].st = 1;
    ram[17].st += 1;
    ram[18].st = 1;
    ram[56].st += 100;
  }

  // companion rescue in level 3
  if (level === 3 && rectHit(ram[11].st, ram[12].st, 6, 6, ram[40].st, ram[41].st, 5, 6)) {
    ram[57].st = 1;
    ram[56].st += 200;
    ram[25].st = 40;
  }

  // door opening
  if (level === 2 && ram[18].st) ram[36].st = (ram[36].st + 1) % 1000;

  // hazards
  moveEnemies();
  const playerHit = (enemyX, enemyY, w, h) => rectHit(ram[11].st, ram[12].st, 6, 6, enemyX, enemyY, w, h);
  if (ram[43].st <= 0) {
    if (playerHit(ram[19].st, ram[20].st, 6, 6) || playerHit(ram[22].st, ram[23].st, 6, 6) || (level === 3 && playerHit(ram[61].st, ram[62].st, 6, 6))) {
      ram[43].st = 25;
      ram[11].st = ram[58].st;
      ram[12].st = ram[59].st;
      ram[56].st = Math.max(0, ram[56].st - 20);
    }
  }

  // checkpoint
  if (level === 1 && ram[11].st > 48 && ram[12].st > 70) {
    ram[58].st = ram[11].st;
    ram[59].st = ram[12].st;
    ram[60].st = 1;
  }

  // level completion zones
  const reachedExit = (level === 1 && ram[11].st > 82 && ram[12].st < 20) ||
                      (level === 2 && ram[11].st > 82 && ram[12].st < 18) ||
                      (level === 3 && ram[11].st > 82 && ram[12].st > 76);

  if (reachedExit) {
    if (level === 1) ram[26].st = 1;
    if (level === 2) ram[27].st = 1;
    if (level === 3) ram[28].st = 1;
    ram[45].st = 20;
    ram[9].st = 3;
  }
}

// --------------------------------------------------
// 2) STORY / STATE MACHINE
// --------------------------------------------------
ram[9].st = 0;
ram[46].st = 1;
ram[47].st = 0;
ram[44].st = 0;
ram[56].st = 0;
resetLevel(1);

currentGameLoop = setInterval(function () {
  ram[8].st++;

  // edge capture for buttons
  const aNow = !!ram[0].st, sNow = !!ram[6].st, lNow = !!ram[4].st, rNow = !!ram[5].st, uNow = !!ram[2].st, dNow = !!ram[3].st;
  const aJust = aNow && !ram[49].st;
  const sJust = sNow && !ram[50].st;
  const lJust = lNow && !ram[51].st;
  const rJust = rNow && !ram[52].st;
  const uJust = uNow && !ram[53].st;
  const dJust = dNow && !ram[54].st;
  ram[49].st = aNow ? 1 : 0;
  ram[50].st = sNow ? 1 : 0;
  ram[51].st = lNow ? 1 : 0;
  ram[52].st = rNow ? 1 : 0;
  ram[53].st = uNow ? 1 : 0;
  ram[54].st = dNow ? 1 : 0;

  if (ram[47].st === 0) ram[47].st = Math.floor(ram[8].st / 20) % 2;

  // state 0 - title
  if (ram[9].st === 0) {
    clearScreen(8, 10, 20);
    for (let i = 0; i < 96; i += 4) {
      fillRect(i, 0, i, 95, 20 + (i % 10), 25 + (i % 8), 40 + (i % 14));
    }
    drawDiamond(48, 28, 19, 255, 210, 0);
    drawDiamond(48, 28, 14, 30, 30, 45);
    drawTextLike("GOLD STICKER QUEST", 7, 18, 255, 255, 255);
    drawTextLike("TOP VIEW STORY ROM", 12, 24, 180, 220, 255);
    drawTextLike("A TO BEGIN", 28, 78, 255, 220, 0);
    drawTextLike("START FOR MAP", 24, 84, 255, 255, 255);
    if (aJust || sJust) {
      ram[9].st = 1;
      ram[46].st = 1;
    }
  }

  // state 1 - intro story 1
  else if (ram[9].st === 1) {
    drawStoryScreen("EPISODE 1", "THE CITY LOST ITS GOLD", "FIND THE BEACON FIRST.");
    if (aJust || sJust) { ram[9].st = 10; resetLevel(1); }
  }

  // state 2 - intro story 2
  else if (ram[9].st === 2) {
    drawStoryScreen("EPISODE 2", "A KEY OPENS THE MIRROR DOOR", "BUT SOMETHING IS FOLLOWING.");
    if (aJust || sJust) { ram[9].st = 10; resetLevel(2); }
  }

  // state 3 - level clear
  else if (ram[9].st === 3) {
    clearScreen(0, 24, 10);
    drawDiamond(48, 26, 16, 255, 220, 0);
    drawTextLike("LEVEL CLEAR", 22, 14, 255, 255, 255);
    drawTextLike("A TO CONTINUE", 24, 80, 255, 220, 0);
    if (aJust || sJust) {
      if (!ram[26].st) { ram[9].st = 2; resetLevel(2); }
      else if (!ram[27].st) { ram[9].st = 4; resetLevel(2); }
      else if (!ram[28].st) { ram[9].st = 6; resetLevel(3); }
      else { ram[9].st = 7; }
    }
  }

  // state 4 - story before level 3
  else if (ram[9].st === 4) {
    drawStoryScreen("EPISODE 3", "THE TOWER IS HUNGRY FOR LIGHT", "SAVE THE COMPANION.");
    if (aJust || sJust) { ram[9].st = 10; resetLevel(3); }
  }

  // state 5 - game over
  else if (ram[9].st === 5) {
    clearScreen(28, 0, 4);
    drawTextLike("YOU WERE CAUGHT", 18, 24, 255, 255, 255);
    drawTextLike("A TO RETRY", 28, 34, 255, 220, 0);
    drawTextLike("START FOR MAP", 22, 42, 255, 255, 255);
    drawOutline(30, 56, 66, 80, 255, 255, 255);
    fillRect(33, 60, 63, 76, 255, 80, 80);
    if (aJust || sJust) {
      ram[9].st = 10;
      resetLevel(ram[16].st || 1);
    }
  }

  // state 6 - ending intro
  else if (ram[9].st === 6) {
    drawStoryScreen("FINAL LEVEL", "THE LAST DOOR IS OPEN", "BRING THE COMPANION HOME.");
    if (aJust || sJust) { ram[9].st = 10; resetLevel(3); }
  }

  // state 7 - ending
  else if (ram[9].st === 7) {
    clearScreen(2, 16, 10);
    for (let y = 0; y < 96; y += 3) fillRect(0, y, 95, y, 2, 16 + (y % 10), 10 + (y % 6));
    drawDiamond(48, 24, 18, 255, 215, 0);
    drawDiamond(48, 24, 13, 255, 255, 255);
    drawTextLike("THE QUEST IS DONE", 14, 16, 255, 255, 255);
    drawTextLike("THE STICKER SHINES AGAIN", 6, 24, 255, 220, 0);
    drawTextLike("SCORE", 28, 62, 255, 255, 255);
    drawTextLike(String(ram[56].st), 60, 62, 255, 220, 0);
    drawTextLike("START FOR MAP", 22, 80, 255, 255, 255);
    if (aJust || sJust) {
      ram[9].st = 10;
      ram[44].st = 1;
    }
  }

  // state 10 - map / world select
  else if (ram[9].st === 10) {
    drawMap();
    if (lJust && ram[46].st > 1) ram[46].st--;
    if (rJust && ram[46].st < 3) ram[46].st++;
    if (uJust && ram[46].st > 1) ram[46].st--;
    if (dJust && ram[46].st < 3) ram[46].st++;
    if (aJust || sJust) {
      if (ram[46].st === 1) { ram[9].st = 1; resetLevel(1); }
      if (ram[46].st === 2) { ram[9].st = 2; resetLevel(2); }
      if (ram[46].st === 3) { ram[9].st = 4; resetLevel(3); }
    }
  }

  // state 11+ - gameplay by level
  else if (ram[9].st >= 11 && ram[9].st <= 13) {
    const lvl = ram[9].st - 10;
    drawLevel(lvl);
    updateGameplay();
    if (lvl === 1 && ram[8].st % 240 === 0) ram[25].st = 1;
    if (lvl === 2 && ram[8].st % 260 === 0) ram[25].st = 1;
    if (lvl === 3 && ram[8].st % 220 === 0) ram[25].st = 1;
  }

  // Map/state routing into gameplay
  if (ram[9].st === 1 || ram[9].st === 2 || ram[9].st === 4) {
    // these are story pages, not gameplay states
  }

  // Standard gameplay states are entered through transitions below.
  if (ram[9].st === 10) {
    // map only
  }

  // Keep a route for actual level state values
  if (ram[9].st === 1) {
    // story state 1, not gameplay
  }

  // Convert map-selected level into gameplay state while preserving story
  if (ram[9].st === 11 || ram[9].st === 12 || ram[9].st === 13) {
    // handled above
  }

  // If the map choice starts a level, jump to gameplay state number.
  if (ram[9].st === 1 && aJust) {
    // no-op
  }

  // Actually use the title/story routing:
  // 1 -> story 1 -> gameplay 11
  // 2 -> story 2 -> gameplay 12
  // 4 -> story 3 -> gameplay 13
  if (ram[9].st === 10) {
    // already on map
  }

  // Prevent stale input from locking the screen on phones.
  if (ram[43].st > 20) ram[43].st = 20;

  // Gameplay state machine shorthand:
  // We enter level gameplay through 11/12/13, and complete levels return to state 3.
  if (ram[9].st === 11 || ram[9].st === 12 || ram[9].st === 13) {
    drawLevel(ram[9].st - 10);
    updateGameplay();
  }

  // Story-to-gameplay routing from the intro pages.
  if (ram[9].st === 1 && aJust) {
    ram[9].st = 11;
    resetLevel(1);
  } else if (ram[9].st === 2 && aJust) {
    ram[9].st = 12;
    resetLevel(2);
  } else if (ram[9].st === 4 && aJust) {
    ram[9].st = 13;
    resetLevel(3);
  }

  // Make sure map button works from any major screen.
  if ((ram[9].st === 3 || ram[9].st === 5 || ram[9].st === 7) && sJust) {
    ram[9].st = 10;
    ram[46].st = 1;
  }
}, 50);
