// ==========================================
// PROJECT ZENITH - ROM STEP 3
// ==========================================

// 1. VRAM RESET (100x100 Crisp Viewport)
vram.length = 0;
for (let y = 0; y < 100; y++) {
  let row = [];
  for (let x = 0; x < 100; x++) row.push([0, 0, 0]);
  vram.push(row);
}

// 2. STATE & STATE MANAGEMENT VARIABLES
ram[20].st = 0; // State: 0=Title, 1=Level Select, 2=Gameplay
ram[21].st = 0; // Universal Frame/Animation Counter
ram[22].st = 0; // Music Sequence Tracker
ram[23].st = 1; // Selected Level Identifier (1 to 5)

// Reset Gameplay coordinates
function initGameplaySpace() {
  ram[30].st = 0;  // Cam X
  ram[31].st = -2; // Cam Y (Height)
  ram[32].st = -5; // Cam Z
  ram[33].st = 0;  // Yaw
  ram[34].st = 0;  // Pitch
  ram[35].st = 0;  // Y Velocity
}
initGameplaySpace();

// 3. BRESENHAM'S GRAPHICS ENGINE
function drawLine(x0, y0, x1, y1, r, g, b) {
  let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  let dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1; 
  let err = (dx > dy ? dx : -dy) / 2;
  while (true) {
    if (x0 >= 0 && x0 < 100 && y0 >= 0 && y0 < 100) fcp(x0, y0, r, g, b);
    if (x0 === x1 && y0 === y1) break;
    let e2 = err;
    if (e2 > -dx) { err -= dy; x0 += sx; }
    if (e2 < dy) { err += dx; y0 += sy; }
  }
}

// 2D Classic Text Utility
const fontDict = {
  'P': "111101111100100", 'R': "111101110101101", 'O': "111101101101111",
  'J': "001001001101111", 'E': "111100110100111", 'C': "111100100100111",
  'T': "111010010010010", 'Z': "111001010100111", 'N': "111111111101101",
  'I': "111010010010111", 'H': "101101111101101", 'S': "111100111001111",
  'A': "010101111101101", 'L': "100100100100111", 'V': "101101101101010",
  '1': "010010010010010", '2': "111001111100111", '3': "111001111001111",
  '4': "101101111001001", '5': "111100111001111", 'G': "111100101101111"
};
function drawText(text, x, y, r, g, b) {
  for (let i = 0; i < text.length; i++) {
    let map = fontDict[text[i]];
    if (!map) { x += 4; continue; }
    for (let j = 0; j < 15; j++) {
      if (map[j] === "1") {
        let px = x + (i * 4) + (j % 3);
        let py = y + Math.floor(j / 3);
        if (px >= 0 && px < 100 && py >= 0 && py < 100) fcp(px, py, r, g, b);
      }
    }
  }
}

// 4. 3D OBJECT MESH RENDERING (For Menus and Levels)
// A 3D Octahedron diamond shape to represent our Zenith Logo
const logoVertices = [
  [0, -1.5, 0], [1, 0, 1], [-1, 0, 1], [-1, 0, -1], [1, 0, -1], [0, 1.5, 0]
];
const logoEdges = [
  [0,1], [0,2], [0,3], [0,4], [5,1], [5,2], [5,3], [5,4], [1,2], [2,3], [3,4], [4,1]
];

function draw3DMesh(vertices, edges, posX, posY, posZ, rotY, r, g, b) {
  let cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  let projected = [];

  // Project Vertices
  for (let i = 0; i < vertices.length; i++) {
    let v = vertices[i];
    // Rotate around local Y axis
    let rx = v[0] * cosY - v[2] * sinY;
    let rz = v[0] * sinY + v[2] * cosY;
    let ry = v[1];

    // Translate relative to camera position
    let transX = rx + posX;
    let transY = ry + posY;
    let transZ = rz + posZ;

    if (transZ <= 0.1) transZ = 0.1;

    // Perspective Projection to 2D screen coordinates
    let sx = Math.floor((transX / transZ) * 60 + 50);
    let sy = Math.floor((transY / transZ) * 60 + 50);
    projected.push({x: sx, y: sy});
  }

  // Draw connecting line Edges
  for (let i = 0; i < edges.length; i++) {
    let p1 = projected[edges[i][0]];
    let p2 = projected[edges[i][1]];
    drawLine(p1.x, p1.y, p2.x, p2.y, r, g, b);
  }
}

// 5. WORLD GEOMETRY CONFIG (Demo Mode)
const mapEdges = [
  [-3, 0, -3,  3, 0, -3], [3, 0, -3,  3, 0, 3], [3, 0, 3,  -3, 0, 3], [-3, 0, 3, -3, 0, -3],
  [-2, 0, 8,   2, 0, 8],  [2, 0, 8,   2, 0, 14], [2, 0, 14, -2, 0, 14], [-2, 0, 14, -2, 0, 8]
];

// 6. RHYTHMIC MUSIC SEQUENCER
const bgm = [
  {n: "E5", d: 0.12}, {n: "B4", d: 0.12}, {n: "C5", d: 0.12}, {n: "D5", d: 0.12},
  {n: "C5", d: 0.12}, {n: "B4", d: 0.12}, {n: "A4", d: 0.12}, {n: "A4", d: 0.12}
];
function playMusic(rate) {
  if (ram[21].st % rate === 0) {
    let note = bgm[ram[22].st % bgm.length];
    playNote(note.n, note.d);
    ram[22].st++;
  }
}

// 7. CORE ENGINE CONTROLLER SUBROUTINES
function runTitleScreen() {
  frcp(0, 0, 99, 99, 5, 5, 15); // Deep space background
  
  // Render Spinning 3D Geometric Zenith Diamond logo!
  let angle = ram[21].st * 0.04;
  draw3DMesh(logoVertices, logoEdges, 0, -0.4, 3.5, angle, 0, 255, 255);

  drawText("PROJECT", 36, 65, 255, 255, 255);
  drawText("ZENITH", 38, 75, 0, 255, 255);

  if (ram[21].st % 30 < 15) drawText("PRESS START", 28, 90, 255, 100, 100);
  
  playMusic(12);

  // Switch to Level Select
  if (ram[7].st) {
    ram[20].st = 1;
    ram[21].st = 0;
    playNote("E5", 0.15);
  }
}

function runLevelSelect() {
  frcp(0, 0, 99, 99, 15, 10, 20);
  
  drawText("SELECT LEVEL", 26, 15, 200, 200, 255);

  // Draw Level Slots dynamically
  for (let l = 1; l <= 5; l++) {
    let posY = 30 + (l * 10);
    let colorR = (ram[23].st === l) ? 0 : 100;
    let colorG = (ram[23].st === l) ? 255 : 100;
    let colorB = (ram[23].st === l) ? 255 : 100;
    
    let prefix = (ram[23].st === l) ? "G " : "  ";
    drawText(prefix + "LEVEL " + l, 25, posY, colorR, colorG, colorB);
  }

  // Spin a smaller accessory ring icon
  draw3DMesh(logoVertices, logoEdges, 2.2, 0.4, 4, ram[21].st * 0.06, 255, 255, 0);

  // Menu Selection Controls via Player 1 D-Pad (Up/Down)
  if (ram[21].st % 6 === 0) {
    if (ram[3].st && ram[23].st > 1) { ram[23].st--; playNote("C5", 0.05); }
    if (ram[4].st && ram[23].st < 5) { ram[23].st++; playNote("C5", 0.05); }
  }

  // Select Level and Enter Gameplay
  if (ram[7].st) {
    initGameplaySpace();
    ram[20].st = 2; // Jump to gameplay
    ram[21].st = 0;
    playNote("C6", 0.3);
  }
}

function runGameplaySpace() {
  frcp(0, 0, 99, 99, 0, 0, 0); // Black backdrop

  let speed = 0.15;
  let cosY = Math.cos(ram[33].st);
  let sinY = Math.sin(ram[33].st);

  // FIXED CORRECTED CAMERA VECTOR MOVEMENT
  if (ram[3].st) { ram[30].st += sinY * speed; ram[32].st += cosY * speed; } // Move Forward
  if (ram[4].st) { ram[30].st -= sinY * speed; ram[32].st -= cosY * speed; } // Move Backward
  if (ram[5].st) { ram[30].st -= cosY * speed; ram[32].st += sinY * speed; } // Strafe Left
  if (ram[6].st) { ram[30].st += cosY * speed; ram[32].st -= sinY * speed; } // Strafe Right

  // CAMERA YAW/PITCH LOOK (Player 2 D-Pad)
  if (ram[13].st) ram[33].st -= 0.04; 
  if (ram[14].st) ram[33].st += 0.04; 
  if (ram[11].st) ram[34].st -= 0.04; 
  if (ram[12].st) ram[34].st += 0.04; 

  // Jumping and Basic Floor Clamping
  if (ram[1].st && ram[31].st >= -2) { ram[35].st = -0.5; playNote("G4", 0.08); }
  ram[35].st += 0.04; 
  ram[31].st += ram[35].st; 
  if (ram[31].st > -2) { ram[31].st = -2; ram[35].st = 0; }

  // 3D Projection Pipeline
  let cx = ram[30].st, cy = ram[31].st, cz = ram[32].st;
  let yaw = ram[33].st, pitch = ram[34].st;
  let cY = Math.cos(yaw), sY = Math.sin(yaw);
  let cP = Math.cos(pitch), sP = Math.sin(pitch);

  for (let i = 0; i < mapEdges.length; i++) {
    let edge = mapEdges[i];
    let ax = edge[0] - cx, ay = edge[1] - cy, az = edge[2] - cz;
    let tx1 = ax * cY - az * sY, tz1 = ax * sY + az * cY;
    let ty1 = ay * cP - tz1 * sP, tzz1 = ay * sP + tz1 * cP;

    let bx = edge[3] - cx, by = edge[4] - cy, bz = edge[5] - cz;
    let tx2 = bx * cY - bz * sY, tz2 = bx * sY + bz * cY;
    let ty2 = by * cP - tz2 * sP, tzz2 = by * sP + tz2 * cP;

    if (tzz1 < 0.1 && tzz2 < 0.1) continue;
    if (tzz1 < 0.1) tzz1 = 0.1; if (tzz2 < 0.1) tzz2 = 0.1;

    let sxA = Math.floor((tx1 / tzz1) * 60 + 50);
    let syA = Math.floor((ty1 / tzz1) * 60 + 50);
    let sxB = Math.floor((tx2 / tzz2) * 60 + 50);
    let syB = Math.floor((ty2 / tzz2) * 60 + 50);

    drawLine(sxA, syA, sxB, syB, 0, 255, 255);
  }

  // HUD text showing selected level context
  drawText("LVL " + ram[23].st, 4, 4, 0, 255, 0);

  playMusic(8);
}

// 8. UNIFIED GAME TICK INTERVAL
function zenithLoop() {
  ram[21].st++;
  if (ram[20].st === 0) runTitleScreen();
  else if (ram[20].st === 1) runLevelSelect();
  else if (ram[20].st === 2) runGameplaySpace();
}

clearInterval(currentGameLoop);
currentGameLoop = setInterval(zenithLoop, 1000 / 30);