// ============================================================================
//   ANOINTO LOGIC SYSTEMS: SCROLLER ENGINE v10.6 [RESTORED 2-PLAYER & AI]
// ============================================================================

// Ensure RAM has enough space for Player 2 variables without overwriting
while (ram.length < 65) { ram.push({st: 0}); }

if (vram.length !== 64) {
    vram.length = 0; 
    for (let y = 0; y < 64; y++) {
        let row = [];
        for (let x = 0; x < 64; x++) { row.push([0, 0, 0]); }
        vram.push(row);
    }
}

// ==========================================
// RENDER BOUNDARY CLAMPING HELPERS (Prevents Edge Crashes)
// ==========================================
function safeFRCP(x1, y1, x2, y2, r, g, b) {
    let cx1 = Math.max(0, Math.floor(x1)); let cx2 = Math.min(63, Math.floor(x2));
    let cy1 = Math.max(0, Math.floor(y1)); let cy2 = Math.min(63, Math.floor(y2));
    if (cx1 <= cx2 && cy1 <= cy2) { frcp(cx1, cy1, cx2, cy2, r, g, b); }
}

function safeFCP(x, y, r, g, b) {
    let cx = Math.floor(x); let cy = Math.floor(y);
    if (cx >= 0 && cx < 64 && cy >= 0 && cy < 64) { fcp(cx, cy, r, g, b); }
}

let animTimer = 0;
let stateTransitionTimer = 0;
let targetState = 0;

let lastInput = -1;
let cheatCode = [1, 2, 3, 6, 4, 5, 8, 7]; 
let cheatProgress = 0;

let gameParticles = [];
function spawnSparkBurst(worldX, worldY, r, g, b, count = 5) {
    for (let i = 0; i < count; i++) {
        gameParticles.push({
            x: worldX, y: worldY,
            vx: (Math.random() - 0.5) * 2.5, vy: (Math.random() - 0.5) * 2 - 1.5,
            life: 10 + Math.floor(Math.random() * 8), r: r, g: g, b: b
        });
    }
}

// GLOBAL GAME MEMORY MAP (P2 uses RAM 47-58)
ram[20].st = 0; // Main State
ram[29].st = 1; // Current Level Select
ram[33].st = 0; // Orbs
ram[34].st = 0; // Pause Master
ram[35].st = 0; // Pause Option
ram[36].st = 0; // Secret Unlocked Flag
ram[37].st = 1; // Theme Style
ram[38].st = 0; // Armor Flag
ram[39].st = 0; // I-Frames Timer (P1)
ram[40].st = 0; // Level Width
ram[41].st = 0; // Secret Key Status
ram[42].st = 0; // Jump Tracking (P1)
ram[43].st = 0; // Map Camera X Interpolation
ram[44].st = 0; // BGM Sequencer Tick
ram[46].st = 0; // PROGRESSION LOCK
if (typeof ram[47] === 'undefined' || !ram[47].st) ram[47].st = 1; // PLAYER COUNT
ram[57].st = 1; // Player 1 Facing

// LEVEL STATIC DATA
const lvl1Platforms = [
    {x1: 40, x2: 75, y: 44, h: 12}, {x1: 95, x2: 110, y: 34, h: 3},     
    {x1: 130, x2: 180, y: 26, h: 4}, {x1: 200, x2: 215, y: 38, h: 18},   
    {x1: 240, x2: 300, y: 44, h: 12}, {x1: 330, x2: 410, y: 24, h: 4},    
    {x1: 440, x2: 460, y: 38, h: 4}, {x1: 490, x2: 560, y: 44, h: 12},   
    {x1: 590, x2: 640, y: 30, h: 4}, {x1: 670, x2: 690, y: 42, h: 14},   
    {x1: 720, x2: 800, y: 22, h: 4}, {x1: 830, x2: 890, y: 34, h: 4},    
    {x1: 920, x2: 980, y: 44, h: 12}, {x1: 1010, x2: 1030, y: 32, h: 4},  
    {x1: 1060, x2: 1130, y: 40, h: 16}  
];

const lvl2Platforms = [
    {x1: 35, x2: 85, y: 42, h: 14}, {x1: 110, x2: 160, y: 28, h: 4},    
    {x1: 190, x2: 230, y: 36, h: 4}, {x1: 260, x2: 285, y: 22, h: 4},    
    {x1: 310, x2: 370, y: 44, h: 12}, {x1: 400, x2: 425, y: 32, h: 4},    
    {x1: 460, x2: 520, y: 24, h: 4}, {x1: 550, x2: 600, y: 40, h: 16},   
    {x1: 630, x2: 700, y: 44, h: 12}, {x1: 730, x2: 755, y: 30, h: 4},    
    {x1: 785, x2: 840, y: 22, h: 4}, {x1: 870, x2: 930, y: 44, h: 12},   
    {x1: 960, x2: 1040, y: 44, h: 12}, {x1: 850, x2: 880, y: 36, h: 4},    
    {x1: 910, x2: 940, y: 26, h: 4}, {x1: 970, x2: 1000, y: 16, h: 4},   
    {x1: 25, x2: 970, y: 16, h: 4}      
];
const lvl2Springs = [{x: 60, y: 40, width: 6}, {x: 340, y: 42, width: 6}, {x: 660, y: 42, width: 6}];

let levelOrbs = [];
let activeEnemies = [];
let specialPlatforms = [];
let specialSprings = [];
let lvl3Slopes = [];
let lvl3SturdyBlocks = [];
let lvl3Hazards = [];
let lvl4MovingPlats = [];
let lvl4FragilePlats = [];

const bgm1 = ["C4", "", "E4", "", "G4", "", "C5", "", "G4", "", "E4", ""];
const bgm2 = ["D3", "", "F3", "", "A3", "", "D4", "", "A3", "", "F3", ""];
const bgm3 = ["E3", "E3", "G3", "", "B3", "B3", "E4", "", "C4", "", "G3", ""];
const bgm4 = ["F4", "A4", "C5", "A4", "F4", "E4", "G4", "C5"]; 
const bgmS = ["A4", "C5", "E5", "A5", "E5", "C5"]; 

function changeGameState(nextState) {
    if (stateTransitionTimer === 0) { stateTransitionTimer = 1; targetState = nextState; }
}

function initLevelAssets(lvl) {
    activeEnemies = []; levelOrbs = []; specialPlatforms = []; specialSprings = []; 
    lvl3Slopes = []; lvl3SturdyBlocks = []; lvl3Hazards = []; 
    lvl4MovingPlats = []; lvl4FragilePlats = []; gameParticles = [];
    ram[41].st = 0; ram[44].st = 0; 
    
    if (lvl === 1) {
        ram[40].st = 1200; ram[37].st = 1;
        activeEnemies.push({type: 'ground', x: 250, minX: 242, maxX: 290, y: 39, dir: 1, alive: true});
        activeEnemies.push({type: 'ground', x: 500, minX: 495, maxX: 550, y: 39, dir: 1, alive: true});
        activeEnemies.push({type: 'ground', x: 930, minX: 922, maxX: 970, y: 39, dir: 1, alive: true});
        activeEnemies.push({type: 'fly', x: 145, baseY: 28, timer: 0, alive: true});
        activeEnemies.push({type: 'fly', x: 360, baseY: 26, timer: 2, alive: true});
        activeEnemies.push({type: 'fly', x: 750, baseY: 28, timer: 4, alive: true});
        let orbPositions = [60, 102, 150, 270, 380, 520, 610, 760, 860, 950, 1020];
        for (let ox of orbPositions) { levelOrbs.push({x: ox, y: 16, picked: false}); }

    } else if (lvl === 2) {
        ram[40].st = 1100; ram[37].st = 2;
        activeEnemies.push({type: 'ground', x: 50, minX: 38, maxX: 75, y: 37, dir: 1, alive: true});
        activeEnemies.push({type: 'ground', x: 325, minX: 312, maxX: 360, y: 39, dir: 1, alive: true});
        activeEnemies.push({type: 'ground', x: 645, minX: 632, maxX: 690, y: 39, dir: 1, alive: true});
        activeEnemies.push({type: 'fly', x: 125, baseY: 28, timer: 1, alive: true});
        activeEnemies.push({type: 'fly', x: 490, baseY: 24, timer: 3, alive: true});
        activeEnemies.push({type: 'fly', x: 810, baseY: 26, timer: 5, alive: true});
        activeEnemies.push({type: 'ground', x: 400, minX: 100, maxX: 800, y: 11, dir: 1, alive: true});
        let orbPositionsLvl2 = [50, 70, 130, 210, 270, 410, 490, 570, 680, 810, 900, 1000];
        for (let ox of orbPositionsLvl2) { levelOrbs.push({x: ox, y: 14, picked: false}); }

    } else if (lvl === 3) {
        ram[40].st = 1920; ram[37].st = 3;
        specialPlatforms.push({x1: 0, x2: 70, y: 48, h: 16});
        lvl3Slopes.push({x1: 70, x2: 100, y1: 48, y2: 30});
        specialPlatforms.push({x1: 100, x2: 140, y: 30, h: 4});
        lvl3SturdyBlocks.push({x: 130, y: 14, w: 10, h: 16});
        specialPlatforms.push({x1: 155, x2: 240, y: 48, h: 16});
        lvl3Hazards.push({x: 145, y: 60, baseY: 65, vy: -4.5});
        activeEnemies.push({type: 'hunter', x: 180, y: 20, vy: 0, minX: 160, maxX: 230, dir: 1, state: 'patrol', alertTimer: 0, alive: true});

        let cx = 260;
        while (cx < 1800) {
            let width = 60 + Math.floor(Math.random() * 40);
            if (Math.random() < 0.5) {
                specialPlatforms.push({x1: cx, x2: cx + width, y: 48, h: 16});
                lvl3SturdyBlocks.push({x: cx + width/2, y: 34, w: 14, h: 14});
                activeEnemies.push({type: 'ground', x: cx + 10, minX: cx + 5, maxX: cx + width - 5, y: 43, dir: 1, alive: true});
                if (Math.random() < 0.5) levelOrbs.push({x: cx + width/2 + 2, y: 26, picked: false});
            } else {
                lvl3Slopes.push({x1: cx, x2: cx + 30, y1: 48, y2: 24});
                specialPlatforms.push({x1: cx + 30, x2: cx + width, y: 24, h: 4});
                lvl3Slopes.push({x1: cx + width, x2: cx + width + 30, y1: 24, y2: 48});
                activeEnemies.push({type: 'hunter', x: cx + 40, y: 10, vy: 0, minX: cx + 30, maxX: cx + width, dir: 1, state: 'patrol', alertTimer: 0, alive: true});
                activeEnemies.push({type: 'fly', x: cx + width/2, baseY: 10, timer: Math.random()*5, alive: true});
                levelOrbs.push({x: cx + 45, y: 16, picked: false});
                width += 30; 
            }
            let gap = 20 + Math.floor(Math.random() * 15);
            if (cx > 400 && Math.random() < 0.8) { lvl3Hazards.push({x: cx + width + (gap/2), y: 60, baseY: 65, vy: -3.5 - Math.random() * 2}); }
            cx += width + gap;
        }
        specialPlatforms.push({x1: 1800, x2: 1920, y: 48, h: 16});

    } else if (lvl === 4) { 
        ram[40].st = 1280; ram[37].st = 4;
        specialPlatforms.push({x1: 0, x2: 50, y: 48, h: 16}); 
        lvl4MovingPlats.push({x: 60, y: 40, w: 24, h: 4, type: 'sticky', path: 'horiz', cx: 80, cy: 40, radius: 20, speed: 0.04, timer: 0});
        lvl3SturdyBlocks.push({x: 80, y: 20, w: 10, h: 10});
        lvl4FragilePlats.push({x: 120, y: 36, w: 16, h: 4, active: true, touchTimer: 0});
        lvl4FragilePlats.push({x: 140, y: 36, w: 16, h: 4, active: true, touchTimer: 0});
        lvl4MovingPlats.push({x: 170, y: 30, w: 16, h: 4, type: 'slide', path: 'vert', cx: 170, cy: 30, radius: 15, speed: 0.06, timer: 0});
        
        specialPlatforms.push({x1: 200, x2: 240, y: 20, h: 4});
        activeEnemies.push({type: 'hunter', x: 215, y: 10, vy: 0, minX: 200, maxX: 235, dir: 1, state: 'patrol', alertTimer: 0, alive: true});
        
        lvl3Slopes.push({x1: 240, x2: 260, y1: 20, y2: 48});
        specialPlatforms.push({x1: 260, x2: 280, y: 48, h: 16});
        lvl4MovingPlats.push({x: 320, y: 40, w: 20, h: 4, type: 'sticky', path: 'circ', cx: 320, cy: 30, radius: 20, speed: 0.03, timer: 0});
        levelOrbs.push({x: 320, y: 10, picked: false});

        let cx = 370;
        while (cx < 1180) {
            let roll = Math.random();
            if (roll < 0.33) {
                specialPlatforms.push({x1: cx, x2: cx + 20, y: 40, h: 4});
                lvl4MovingPlats.push({x: cx + 30, y: 40, w: 16, h: 4, type: 'sticky', path: 'horiz', cx: cx + 45, cy: 40, radius: 15, speed: 0.05, timer: Math.random()*10});
                specialPlatforms.push({x1: cx + 70, x2: cx + 90, y: 40, h: 4});
                cx += 100;
            } else if (roll < 0.66) {
                lvl4FragilePlats.push({x: cx, y: 48, w: 40, h: 4, active: true, touchTimer: 0});
                lvl3SturdyBlocks.push({x: cx+10, y: 30, w: 20, h: 12}); 
                activeEnemies.push({type: 'fly', x: cx + 20, baseY: 15, timer: 0, alive: true});
                cx += 60;
            } else {
                lvl4MovingPlats.push({x: cx, y: 40, w: 16, h: 4, type: 'slide', path: 'vert', cx: cx, cy: 35, radius: 15, speed: 0.06, timer: Math.random()*5});
                lvl4MovingPlats.push({x: cx + 30, y: 20, w: 16, h: 4, type: 'slide', path: 'vert', cx: cx + 30, cy: 30, radius: 15, speed: 0.05, timer: Math.random()*5});
                levelOrbs.push({x: cx + 35, y: 10, picked: false});
                cx += 60;
            }
        }
        specialPlatforms.push({x1: 1180, x2: 1280, y: 40, h: 16});

    } else if (lvl === 5) {
        ram[37].st = 1; ram[40].st = 768; 
        let cx = 0; 
        while (cx < ram[40].st - 90) {
            let fw = 100 + Math.floor(Math.random() * 35); 
            specialPlatforms.push({x1: cx, x2: cx + fw, y: 46, h: 18});
            if (cx > 120 && Math.random() < 0.35) {
                activeEnemies.push({type: 'ground', x: cx + 25, minX: cx + 10, maxX: cx + fw - 25, y: 41, dir: 1, alive: true});
            }
            if (Math.random() < 0.5) {
                specialPlatforms.push({x1: cx + 25, x2: cx + fw - 25, y: 24, h: 4});
                levelOrbs.push({x: cx + fw / 2, y: 16, picked: false});
                if (cx > 120 && Math.random() < 0.3) {
                    activeEnemies.push({type: 'fly', x: cx + fw / 2, baseY: 12, timer: 0, alive: true});
                }
            } else {
                levelOrbs.push({x: cx + fw / 2, y: 36, picked: false});
            }
            cx += fw + 22; 
        }
        specialPlatforms.push({x1: ram[40].st - 90, x2: ram[40].st, y: 46, h: 18});
    }
}

const miniFont = {
    'A': [1,1,1, 1,0,1, 1,1,1, 1,0,1, 1,0,1], 'B': [1,1,0, 1,0,1, 1,1,0, 1,0,1, 1,1,0],
    'C': [1,1,1, 1,0,0, 1,0,0, 1,0,0, 1,1,1], 'D': [1,1,0, 1,0,1, 1,0,1, 1,0,1, 1,1,0],
    'E': [1,1,1, 1,0,0, 1,1,1, 1,0,0, 1,1,1], 'F': [1,1,1, 1,0,0, 1,1,1, 1,0,0, 1,0,0],
    'G': [1,1,1, 1,0,0, 1,0,1, 1,0,1, 1,1,1], 'H': [1,0,1, 1,0,1, 1,1,1, 1,0,1, 1,0,1],
    'I': [1,1,1, 0,1,0, 0,1,0, 0,1,0, 1,1,1], 'J': [0,1,1, 0,0,1, 0,0,1, 1,0,1, 1,1,1],
    'K': [1,0,1, 1,1,0, 1,1,0, 1,0,1, 1,0,1], 'L': [1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,1,1],
    'M': [1,0,1, 1,1,1, 1,0,1, 1,0,1, 1,0,1], 'N': [1,0,1, 1,1,1, 1,1,1, 1,0,1, 1,0,1],
    'O': [1,1,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1], 'P': [1,1,1, 1,0,1, 1,1,1, 1,0,0, 1,0,0],
    'Q': [1,1,1, 1,0,1, 1,0,1, 1,1,1, 0,0,1], 'R': [1,1,1, 1,0,1, 1,1,1, 1,1,0, 1,0,1],
    'S': [1,1,1, 1,0,0, 1,1,1, 0,0,1, 1,1,1], 'T': [1,1,1, 0,1,0, 0,1,0, 0,1,0, 0,1,0],
    'U': [1,0,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1], 'V': [1,0,1, 1,0,1, 1,0,1, 1,0,1, 0,1,0],
    'W': [1,0,1, 1,0,1, 1,0,1, 1,1,1, 1,0,1], 'X': [1,0,1, 1,0,1, 0,1,0, 1,0,1, 1,0,1],
    'Y': [1,0,1, 1,0,1, 0,1,0, 0,1,0, 0,1,0], 'Z': [1,1,1, 0,0,1, 0,1,0, 1,0,0, 1,1,1],
    '1': [0,1,0, 1,1,0, 0,1,0, 0,1,0, 1,1,1], '2': [1,1,1, 0,0,1, 1,1,1, 1,0,0, 1,1,1], 
    '3': [1,1,1, 0,0,1, 1,1,1, 0,0,1, 1,1,1], '4': [1,0,1, 1,0,1, 1,1,1, 0,0,1, 0,0,1], 
    '5': [1,1,1, 1,0,0, 1,1,1, 0,0,1, 1,1,1], '6': [1,1,1, 1,0,0, 1,1,1, 1,0,1, 1,1,1], 
    '7': [1,1,1, 0,0,1, 0,1,0, 0,1,0, 0,1,0], '8': [1,1,1, 1,0,1, 1,1,1, 1,0,1, 1,1,1], 
    '9': [1,1,1, 1,0,1, 1,1,1, 0,0,1, 1,1,1], '0': [1,1,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1], 
    ':': [0,0,0, 0,1,0, 0,0,0, 0,1,0, 0,0,0], ' ': [0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0], 
    '-': [0,0,0, 0,0,0, 1,1,1, 0,0,0, 0,0,0]
};

function drawText(str, startX, startY, r, g, b) {
    let curX = startX;
    for (let i = 0; i < str.length; i++) {
        let glyph = miniFont[str[i].toUpperCase()] || miniFont[' '];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 3; col++) {
                if (glyph[row * 3 + col] === 1) {
                    let outX = curX + col; let outY = startY + row;
                    safeFCP(outX, outY, r, g, b); 
                }
            }
        }
        curX += 4; 
    }
}

if (typeof currentGameLoop !== 'undefined') clearInterval(currentGameLoop);
currentGameLoop = setInterval(function () {
    ram[24].st++; 
    animTimer += 0.2;

    if (ram[39].st > 0) { ram[39].st--; } // P1 IFrames
    if (ram[54].st > 0) { ram[54].st--; } // P2 IFrames

    if (ram[26].st === 1) {
        let anyPressed = false;
        for (let i = 1; i <= 16; i++) { if (ram[i] && ram[i].st) anyPressed = true; }
        if (!anyPressed) ram[26].st = 0;
    }

    if (ram[20].st === 0) {
        safeFRCP(0, 0, 63, 63, 20, 20, 35); 
        drawText("ANOINTO", 18, 14, 0, 255, 180); drawText("GEAR", 24, 23, 0, 180, 255);
        
        if (ram[8].st === true && ram[26].st === 0) {
            ram[26].st = 1;
            ram[47].st = (ram[47].st === 2) ? 1 : 2;
            if (typeof playNote === "function") playNote("C5", 0.05);
        }
        
        let pText = (ram[47].st === 2) ? "2 PLAYERS" : "1 PLAYER";
        drawText(pText, (ram[47].st === 2) ? 14 : 16, 35, 255, 255, 255);

        let dynamicY = Math.floor(45 + Math.sin(animTimer) * 1.5);
        if (ram[24].st % 20 < 10) { drawText("START", 22, dynamicY, 255, 215, 0); }

        let currentInput = -1;
        for (let i = 1; i <= 8; i++) { if (ram[i] && ram[i].st) currentInput = i; }
        if (currentInput !== -1 && currentInput !== lastInput) {
            if (currentInput === cheatCode[cheatProgress]) {
                cheatProgress++;
                if (cheatProgress === 8) {
                    ram[38].st = 1; ram[26].st = 1; ram[29].st = 1; changeGameState(1); 
                    if (typeof playNote === "function") { playNote("E6", 0.05); }
                    cheatProgress = 0;
                }
            } else { cheatProgress = 0; }
        }
        lastInput = currentInput;

        if (ram[7].st === true && ram[26].st === 0 && cheatProgress !== 8) { 
            ram[26].st = 1; ram[29].st = 1; changeGameState(1); 
            if (typeof playNote === "function") { playNote("C4", 0.06); }
        }
    }

    else if (ram[20].st === 1) {
        safeFRCP(0, 0, 63, 63, 15, 15, 25);
        
        if (ram[5].st === true && ram[26].st === 0) {
            ram[26].st = 1;
            if (ram[29].st === 3) ram[29].st = 2; else if (ram[29].st === 2) ram[29].st = 1; else if (ram[29].st === 4) ram[29].st = 3;
        }
        if (ram[6].st === true && ram[26].st === 0) {
            ram[26].st = 1;
            if (ram[29].st === 1) ram[29].st = 2; 
            else if (ram[29].st === 2 && ram[46].st === 1) ram[29].st = 3; 
            else if (ram[29].st === 3) ram[29].st = 4;
        }
        if (ram[3].st === true && ram[26].st === 0 && ram[36].st === 1) {
            if (ram[29].st === 1 || ram[29].st === 2) { ram[26].st = 1; ram[29].st = 5; }
        }
        if (ram[4].st === true && ram[26].st === 0) {
            if (ram[29].st === 5) { ram[26].st = 1; ram[29].st = 2; }
        }

        ram[43].st += ((ram[29].st === 3 || ram[29].st === 4 ? 64 : 0) - ram[43].st) * 0.20; 
        let mCamX = Math.floor(ram[43].st);

        for (let i = 0; i < 128; i += 16) { safeFRCP(i - mCamX, 0, i - mCamX, 63, 22, 22, 35); }
        safeFRCP(14 - mCamX, 34, 28 - mCamX, 35, 80, 80, 100); 
        
        if (ram[46].st === 1) {
            safeFRCP(34 - mCamX, 34, 74 - mCamX, 35, 80, 80, 100); 
            safeFRCP(78 - mCamX, 34, 92 - mCamX, 35, 80, 80, 100); 
        } else { drawText("LOCKED", 40 - mCamX, 24, 255, 50, 50); }

        if (ram[36].st === 1) {
            safeFRCP(30 - mCamX, 16, 32 - mCamX, 31, 80, 80, 100); 
            let nSColor = (ram[29].st === 5) ? [255, 0, 255] : [100, 100, 100];
            safeFRCP(28 - mCamX, 10, 34 - mCamX, 16, nSColor[0], nSColor[1], nSColor[2]);
            drawText("S", 30 - mCamX, 3, 255, 255, 255);
        }

        let n1Color = (ram[29].st === 1) ? [0, 255, 150] : [100, 100, 100];
        safeFRCP(8 - mCamX, 31, 14 - mCamX, 37, n1Color[0], n1Color[1], n1Color[2]); drawText("1", 10 - mCamX, 24, 255, 255, 255);
        
        let n2Color = (ram[29].st === 2) ? [240, 90, 40] : [100, 100, 100];
        safeFRCP(28 - mCamX, 31, 34 - mCamX, 37, n2Color[0], n2Color[1], n2Color[2]); drawText("2", 30 - mCamX, 24, 255, 255, 255);
        
        if (ram[46].st === 1) {
            let n3Color = (ram[29].st === 3) ? [255, 60, 60] : [100, 100, 100];
            safeFRCP(74 - mCamX, 31, 80 - mCamX, 37, n3Color[0], n3Color[1], n3Color[2]); drawText("3", 76 - mCamX, 24, 255, 255, 255);
            let n4Color = (ram[29].st === 4) ? [0, 200, 255] : [100, 100, 100];
            safeFRCP(94 - mCamX, 31, 100 - mCamX, 37, n4Color[0], n4Color[1], n4Color[2]); drawText("4", 96 - mCamX, 24, 255, 255, 255);
        }

        drawText("MAP", 4 - mCamX, 6, 255, 255, 255);
        drawText("CORE", 68 - mCamX, 6, 255, 100, 100);

        if ((ram[1].st === true || ram[7].st === true) && ram[26].st === 0) {
            ram[26].st = 1; 
            ram[21].st = 10; ram[22].st = 30; ram[23].st = 0; ram[25].st = 0; ram[32].st = 0; ram[34].st = 0; ram[42].st = 0; ram[57].st = 1; 
            if (ram[47].st === 2) {
                ram[48].st = 20; ram[49].st = 30; ram[50].st = 0; ram[53].st = 0; ram[55].st = 0; ram[58].st = 1;
            }
            initLevelAssets(ram[29].st);
            changeGameState(2);  
            if (typeof playNote === "function") { playNote("C5", 0.05); }
        }
    }

    else if (ram[20].st === 2) {
        let currentLvl = ram[29].st;
        let maxWorldWidth = ram[40].st;
        let goalX = maxWorldWidth - 50;

        if (ram[24].st % 6 === 0 && ram[34].st === 0) {
            let seq = (currentLvl === 1) ? bgm1 : (currentLvl === 2 ? bgm2 : (currentLvl === 3 ? bgm3 : (currentLvl === 4 ? bgm4 : bgmS)));
            let note = seq[ram[44].st];
            if (note !== "" && typeof playNote === "function") playNote(note, 0.03); 
            ram[44].st++; if (ram[44].st >= seq.length) ram[44].st = 0;
        }

        if (ram[7].st === true && ram[26].st === 0) {
            ram[26].st = 1; ram[34].st = (ram[34].st === 0) ? 1 : 0; ram[35].st = 0; 
        }

        if (ram[34].st === 1) {
            if ((ram[3].st === true || ram[4].st === true) && ram[26].st === 0) { 
                ram[26].st = 1; ram[35].st = (ram[35].st === 0) ? 1 : 0; 
            }
            if (ram[1].st === true && ram[26].st === 0) { 
                ram[26].st = 1;
                if (ram[35].st === 0) { ram[34].st = 0; } 
                else { 
                    ram[34].st = 0; 
                    changeGameState(1); 
                }
            }
            safeFRCP(8, 12, 55, 52, 10, 10, 15); drawText("PAUSED", 20, 16, 255, 255, 0);
            drawText("RESUME", 18, 28, (ram[35].st === 0 ? 0 : 150), (ram[35].st === 0 ? 255 : 150), 150);
            drawText("QUIT", 22, 38, (ram[35].st === 1 ? 255 : 150), (ram[35].st === 1 ? 50 : 150), 150);
            return; 
        }

        for (let mp of lvl4MovingPlats) {
            let oldX = mp.x; let oldY = mp.y;
            mp.timer += mp.speed;
            if (mp.path === 'horiz') { mp.x = mp.cx + Math.sin(mp.timer) * mp.radius; } 
            else if (mp.path === 'vert') { mp.y = mp.cy + Math.sin(mp.timer) * mp.radius; } 
            else if (mp.path === 'circ') { mp.x = mp.cx + Math.cos(mp.timer) * mp.radius; mp.y = mp.cy + Math.sin(mp.timer) * mp.radius; }
            mp.dx = mp.x - oldX; mp.dy = mp.y - oldY;
        }

        let activePlayers = [1];
        if (ram[47].st === 2) activePlayers.push(2);

        for (let pNum of activePlayers) {
            let isP2 = (pNum === 2);
            let kLeft = isP2 ? (ram[13] ? ram[13].st : false) : ram[5].st;
            let kRight = isP2 ? (ram[14] ? ram[14].st : false) : ram[6].st;
            let kJump = isP2 ? (ram[9] ? ram[9].st : false) : ram[1].st;
            let kShoot = isP2 ? (ram[10] ? ram[10].st : false) : ram[2].st;
            
            let rx = isP2 ? 48 : 21; let ry = isP2 ? 49 : 22; let rvy = isP2 ? 50 : 23;
            let rProjX = isP2 ? 51 : 27; let rProjY = isP2 ? 52 : 28; let rProjAct = isP2 ? 53 : 32;
            let rJump = isP2 ? 55 : 42; let rFace = isP2 ? 58 : 57;

            let isMoving = false;
            if (kLeft === true && ram[rx].st > 0) { ram[rx].st -= 1.6; ram[rFace].st = -1; isMoving = true; }
            if (kRight === true && ram[rx].st < (maxWorldWidth - 6)) { ram[rx].st += 1.6; ram[rFace].st = 1; isMoving = true; }

            if (kShoot === true && ram[rProjAct].st === 0 && ram[26].st === 0) {
                ram[26].st = 1; ram[rProjAct].st = ram[rFace].st;
                ram[rProjX].st = ram[rx].st + (ram[rFace].st === 1 ? 6 : -4); ram[rProjY].st = ram[ry].st + 2;
                if (typeof playNote === "function") { playNote("G5", 0.03); }
            }
            if (ram[rProjAct].st !== 0) {
                ram[rProjX].st += (3.8 * ram[rProjAct].st);
                if (Math.abs(ram[rProjX].st - ram[rx].st) > 55) { ram[rProjAct].st = 0; }
            }

            ram[rvy].st += 0.52; 
            if (ram[rvy].st > 4.5) ram[rvy].st = 4.5; 
            ram[ry].st += ram[rvy].st; 

            let pLeft = ram[rx].st; let pRight = ram[rx].st + 5;
            let pBottom = ram[ry].st + 5; let oldBottom = pBottom - ram[rvy].st; 
            let isGrounded = false;

            if (currentLvl !== 5 && currentLvl !== 3 && currentLvl !== 4 && pBottom >= 56) { ram[ry].st = 51; ram[rvy].st = 0; isGrounded = true; }
            if (ram[ry].st > 64) { changeGameState(3); }

            let currentPlats = (currentLvl === 1) ? lvl1Platforms : (currentLvl === 2 ? lvl2Platforms : specialPlatforms);
            let currentSprings = (currentLvl === 1 || currentLvl === 3 || currentLvl === 4 || currentLvl === 5) ? [] : lvl2Springs;

            for (let plat of currentPlats) {
                if (ram[rvy].st >= 0 && pRight >= plat.x1 && pLeft <= plat.x2) {
                    if (oldBottom <= plat.y && pBottom >= plat.y) {
                        ram[ry].st = plat.y - 5; ram[rvy].st = 0; isGrounded = true;
                    }
                }
            }

            if (currentLvl === 3 || currentLvl === 4) {
                for (let slope of lvl3Slopes) {
                    if (pRight >= slope.x1 && pLeft <= slope.x2) {
                        let pMidX = (pLeft + pRight) / 2;
                        let t = (pMidX - slope.x1) / (slope.x2 - slope.x1);
                        if (t < 0) t = 0; if (t > 1) t = 1;
                        let slopeSurfaceY = slope.y1 + t * (slope.y2 - slope.y1);
                        if (ram[rvy].st >= 0 && oldBottom <= slopeSurfaceY + 4 && pBottom >= slopeSurfaceY) {
                            ram[ry].st = slopeSurfaceY - 5; ram[rvy].st = 0; isGrounded = true;
                        }
                    }
                }
                let pX = ram[rx].st; let pY = ram[ry].st; let pW = 5; let pH = 5;
                for (let b of lvl3SturdyBlocks) {
                    if (pX + pW > b.x && pX < b.x + b.w && pY + pH > b.y && pY < b.y + b.h) {
                        let overlapX = (pX + pW / 2 < b.x + b.w / 2) ? (pX + pW - b.x) : (b.x + b.w - pX);
                        let overlapY = (pY + pH / 2 < b.y + b.h / 2) ? (pY + pH - b.y) : (b.y + b.h - pY);
                        if (overlapX < overlapY) {
                            if (pX + pW / 2 < b.x + b.w / 2) { ram[rx].st = b.x - pW; } else { ram[rx].st = b.x + b.w; }
                        } else {
                            if (pY + pH / 2 < b.y + b.h / 2) { ram[ry].st = b.y - pH; ram[rvy].st = 0; isGrounded = true; } 
                            else { ram[ry].st = b.y + b.h; if (ram[rvy].st < 0) ram[rvy].st = 0; }
                        }
                    }
                }
                
                if (currentLvl === 4) {
                    for (let mp of lvl4MovingPlats) {
                        if (ram[rvy].st >= 0 && pRight >= mp.x && pLeft <= mp.x + mp.w) {
                            if (oldBottom <= mp.y + 4 && pBottom >= mp.y) {
                                ram[ry].st = mp.y - 5; ram[rvy].st = 0; isGrounded = true;
                                if (mp.type === 'sticky') { ram[rx].st += mp.dx; } 
                            }
                        }
                    }
                    for (let fp of lvl4FragilePlats) {
                        if (!fp.active) continue;
                        if (ram[rvy].st >= 0 && pRight >= fp.x && pLeft <= fp.x + fp.w) {
                            if (oldBottom <= fp.y + 4 && pBottom >= fp.y) {
                                ram[ry].st = fp.y - 5; ram[rvy].st = 0; isGrounded = true;
                                fp.touchTimer++;
                                if (fp.touchTimer > 30) {
                                    fp.active = false; 
                                    spawnSparkBurst(fp.x + fp.w/2, fp.y, 255, 255, 255, 8);
                                }
                            }
                        }
                    }
                }
            }

            for (let spring of currentSprings) {
                if (pRight >= spring.x && pLeft <= (spring.x + spring.width)) {
                    if (pBottom >= spring.y && ram[ry].st <= spring.y + 2) { 
                        ram[rvy].st = -7.8; spawnSparkBurst(spring.x + 3, spring.y, 255, 255, 0, 4);
                    }
                }
            }

            if (kJump === true && isGrounded) { ram[rvy].st = -5.4; ram[rJump].st = 1; } 
            if (kJump === false && ram[rvy].st < -1.8 && ram[rJump].st === 1) { ram[rvy].st = -1.8; ram[rJump].st = 0; }

            for (let orb of levelOrbs) {
                if (!orb.picked && pRight >= orb.x && pLeft <= orb.x + 3 && pBottom >= orb.y && ram[ry].st <= orb.y + 3) {
                    orb.picked = true; ram[33].st++; spawnSparkBurst(orb.x + 1, orb.y + 1, 0, 200, 255, 6);
                }
            }
            
            let keyX = 1020; let keyY = 32;
            if (currentLvl === 2 && ram[41].st === 0) {
                if (pRight >= keyX && pLeft <= keyX + 4 && pBottom >= keyY && ram[ry].st <= keyY + 4) {
                    ram[41].st = 1; spawnSparkBurst(keyX + 2, keyY + 2, 255, 50, 255, 12);
                }
            }
        } 

        // RESTORED ENEMY AI BLOCK
        for (let enemy of activeEnemies) {
            if (!enemy.alive) continue;
            
            if (enemy.type === 'ground') {
                enemy.x += (0.75 * enemy.dir);
                if (enemy.x > enemy.maxX) { enemy.x = enemy.maxX; enemy.dir = -1; }
                if (enemy.x < enemy.minX) { enemy.x = enemy.minX; enemy.dir = 1; }
            } else if (enemy.type === 'fly') {
                enemy.timer += 0.12; enemy.y = enemy.baseY + Math.sin(enemy.timer) * 6;
            } else if (enemy.type === 'hunter') {
                enemy.vy += 0.4; if (enemy.vy > 4) enemy.vy = 4; enemy.y += enemy.vy;
                let eGrounded = false;
                for (let plat of specialPlatforms) {
                    if (enemy.vy >= 0 && enemy.x + 4 >= plat.x1 && enemy.x <= plat.x2) {
                        if (enemy.y + 4 >= plat.y && enemy.y <= plat.y + 2) { enemy.y = plat.y - 4; enemy.vy = 0; eGrounded = true; }
                    }
                }
                for (let b of lvl3SturdyBlocks) {
                    if (enemy.x + 4 >= b.x && enemy.x <= b.x + b.w && enemy.y + 4 >= b.y && enemy.y <= b.y + b.h) {
                        if (enemy.y + 2 <= b.y) { enemy.y = b.y - 4; enemy.vy = 0; eGrounded = true; }
                    }
                }
                if (enemy.state === 'patrol') {
                    enemy.x += (0.45 * enemy.dir);
                    if (enemy.x > enemy.maxX) { enemy.x = enemy.maxX; enemy.dir = -1; }
                    if (enemy.x < enemy.minX) { enemy.x = enemy.minX; enemy.dir = 1; }
                    
                    let closeToP1 = Math.abs(ram[22].st - enemy.y) < 16 && Math.abs(ram[21].st - enemy.x) < 55;
                    let closeToP2 = (ram[47].st === 2) && Math.abs(ram[49].st - enemy.y) < 16 && Math.abs(ram[48].st - enemy.x) < 55;
                    if (closeToP1 || closeToP2) {
                        enemy.state = 'alert'; enemy.alertTimer = 12; enemy.vy = -2.2; 
                        spawnSparkBurst(enemy.x + 2, enemy.y, 255, 100, 0, 3);
                    }
                } else if (enemy.state === 'alert') {
                    enemy.alertTimer--; if (enemy.alertTimer <= 0) { enemy.state = 'chase'; }
                } else if (enemy.state === 'chase') {
                    let targetX = ram[21].st; let targetY = ram[22].st;
                    if (ram[47].st === 2 && Math.abs(ram[48].st - enemy.x) < Math.abs(ram[21].st - enemy.x)) {
                        targetX = ram[48].st; targetY = ram[49].st;
                    }
                    if (targetX > enemy.x) { enemy.x += 0.85; enemy.dir = 1; } else { enemy.x -= 0.85; enemy.dir = -1; }
                    if (targetY < enemy.y - 12 && eGrounded && Math.random() < 0.06) { enemy.vy = -4.5; }
                }
            }

            let ex = enemy.x; let ey = enemy.y; let ew = 4; let eh = 4;
            
            // Player Projectile Hit Detection
            let hitByP1 = ram[32].st !== 0 && ram[27].st + 3 >= ex && ram[27].st <= ex + ew && ram[28].st + 1 >= ey && ram[28].st <= ey + eh;
            let hitByP2 = (ram[47].st === 2) && ram[53].st !== 0 && ram[51].st + 3 >= ex && ram[51].st <= ex + ew && ram[52].st + 1 >= ey && ram[52].st <= ey + eh;

            if (hitByP1 || hitByP2) {
                enemy.alive = false; 
                if (hitByP1) ram[32].st = 0; else ram[53].st = 0;
                spawnSparkBurst(ex + 2, ey + 2, 255, 50, 50, 8);
                continue;
            }

            // Player Body Collision
            for (let pNum of activePlayers) {
                let rx = pNum === 2 ? 48 : 21; let ry = pNum === 2 ? 49 : 22; 
                let rvy = pNum === 2 ? 50 : 23; let rIFrame = pNum === 2 ? 54 : 39;
                
                let pLeft = ram[rx].st; let pRight = ram[rx].st + 5;
                let pBottom = ram[ry].st + 5; let oldBottom = pBottom - ram[rvy].st;

                if (pRight >= ex && pLeft <= ex + ew && pBottom >= ey && ram[ry].st <= ey + eh) {
                    if (ram[rvy].st > 0 && oldBottom <= ey + 1) {
                        // Goomba Stomp
                        enemy.alive = false; ram[rvy].st = -4.2; spawnSparkBurst(ex + 2, ey + 2, 255, 255, 255, 8);
                    } else if (ram[rIFrame].st === 0) { 
                        if (ram[38].st > 0) {
                            ram[38].st = 0; ram[rIFrame].st = 60; ram[rvy].st = -4.0; spawnSparkBurst(ram[rx].st + 2, ram[ry].st + 2, 0, 255, 255, 10);
                        } else {
                            changeGameState(3); 
                        }
                    }
                }
            }
        }

        let idealCamX = ram[21].st - 29;
        if (ram[47].st === 2 && ram[48] && typeof ram[48].st !== 'undefined') { idealCamX = ((ram[21].st + ram[48].st) / 2) - 29; }
        if (idealCamX < 0) idealCamX = 0;
        if (idealCamX > (maxWorldWidth - 64)) idealCamX = (maxWorldWidth - 64); 
        ram[25].st = idealCamX; let camX = ram[25].st;

        let currentPlats = (currentLvl === 1) ? lvl1Platforms : (currentLvl === 2 ? lvl2Platforms : specialPlatforms);
        
        if (currentLvl === 1 || currentLvl === 5) {
            safeFRCP(0, 0, 63, 63, 12, 14, 24); 
            let starOffset = Math.floor((camX * 0.12) % 64); safeFCP((20 - starOffset + 64) % 64, 12, 110, 110, 150); safeFCP((50 - starOffset + 64) % 64, 22, 90, 90, 130);
            let mountOffset = Math.floor((camX * 0.30) % 64); 
            for (let m = -16; m < 80; m += 24) { safeFRCP(m - mountOffset, 48, m - mountOffset + 12, 55, 26, 30, 46); }
            if (currentLvl === 1) {
                safeFRCP(0 - camX, 56, maxWorldWidth - camX, 63, 35, 45, 60); 
            }
            for (let plat of currentPlats) { safeFRCP(plat.x1 - camX, plat.y, plat.x2 - camX, plat.y + plat.h, 0, 170, 120); }
        } else if (currentLvl === 2) {
            safeFRCP(0, 0, 63, 63, 30, 14, 10); 
            let pipesOffset = Math.floor((camX * 0.35) % 64); 
            for (let p = -8; p < 70; p += 20) { safeFRCP(p - pipesOffset, 0, p - pipesOffset + 2, 55, 45, 25, 18); }
            safeFRCP(0 - camX, 56, maxWorldWidth - camX, 63, 65, 30, 20); 
            for (let plat of currentPlats) { safeFRCP(plat.x1 - camX, plat.y, plat.x2 - camX, plat.y + plat.h, 190, 80, 40); }
            for (let spring of currentSprings) { safeFRCP(spring.x - camX, spring.y, spring.x + spring.width - camX, spring.y + 2, 240, 220, 30); }
        } else if (currentLvl === 3) {
            safeFRCP(0, 0, 63, 63, 18, 8, 8); 
            let ashOffset = Math.floor((camX * 0.20) % 64);
            safeFCP((15 - ashOffset + 64) % 64, 15, 200, 100, 0); safeFCP((45 - ashOffset + 64) % 64, 30, 180, 80, 0);
            for (let slope of lvl3Slopes) {
                let step = (slope.x2 - slope.x1);
                for (let sx = 0; sx <= step; sx++) {
                    let ry = Math.floor(slope.y1 + (sx / step) * (slope.y2 - slope.y1));
                    safeFRCP((slope.x1 + sx) - camX, ry, (slope.x1 + sx) - camX, 63, 110, 40, 15);
                    safeFCP((slope.x1 + sx) - camX, ry, 255, 120, 0);
                }
            }
            for (let plat of specialPlatforms) {
                safeFRCP(plat.x1 - camX, plat.y, plat.x2 - camX, plat.y + plat.h, 110, 40, 15);
                safeFRCP(plat.x1 - camX, plat.y, plat.x2 - camX, plat.y + 1, 255, 120, 0);
            }
            for (let b of lvl3SturdyBlocks) {
                safeFRCP(b.x - camX, b.y, b.x + b.w - camX, b.y + b.h, 50, 55, 70);
                safeFRCP(b.x - camX, b.y, b.x + b.w - camX, b.y, 130, 140, 160);
            }
            for (let h of lvl3Hazards) {
                h.y += h.vy; h.vy += 0.16;
                if (h.y > h.baseY) { h.y = h.baseY; h.vy = -4.0 - Math.random() * 2.2; }
                let hx = Math.floor(h.x - camX); let hy = Math.floor(h.y);
                safeFRCP(hx, hy, hx + 2, hy + 2, 255, 70, 0); safeFCP(hx + 1, hy + 1, 255, 255, 150);
                
                for(let p of activePlayers) {
                    let rx = p===2 ? 48 : 21; let ry = p===2 ? 49 : 22;
                    let pR = ram[rx].st + 5; let pL = ram[rx].st; let pB = ram[ry].st + 5;
                    if (pR >= h.x && pL <= h.x + 3 && pB >= h.y && ram[ry].st <= h.y + 3) { changeGameState(3); }
                }
            }
        } else if (currentLvl === 4) {
            // RESTORED LEVEL 4 RENDERING BLOCK
            safeFRCP(0, 0, 63, 63, 5, 10, 25); 
            let gridOffset = Math.floor((camX * 0.15) % 64);
            for (let g = 0; g < 128; g += 16) { safeFRCP(g - gridOffset, 0, g - gridOffset, 63, 10, 25, 45); } 
            
            for (let slope of lvl3Slopes) {
                let step = (slope.x2 - slope.x1);
                for (let sx = 0; sx <= step; sx++) {
                    let ry = Math.floor(slope.y1 + (sx / step) * (slope.y2 - slope.y1));
                    safeFRCP((slope.x1 + sx) - camX, ry, (slope.x1 + sx) - camX, 63, 40, 60, 90); 
                    safeFCP((slope.x1 + sx) - camX, ry, 0, 255, 200);
                }
            }
            for (let plat of specialPlatforms) {
                safeFRCP(plat.x1 - camX, plat.y, plat.x2 - camX, plat.y + plat.h, 40, 60, 90);
                safeFRCP(plat.x1 - camX, plat.y, plat.x2 - camX, plat.y + 1, 0, 255, 200);
            }
            for (let mp of lvl4MovingPlats) {
                let mpx = Math.floor(mp.x - camX);
                if (mp.type === 'sticky') {
                    safeFRCP(mpx, Math.floor(mp.y), mpx + mp.w, Math.floor(mp.y) + mp.h, 10, 100, 100);
                    safeFRCP(mpx, Math.floor(mp.y), mpx + mp.w, Math.floor(mp.y), 0, 255, 0); 
                } else {
                    safeFRCP(mpx, Math.floor(mp.y), mpx + mp.w, Math.floor(mp.y) + mp.h, 150, 60, 10);
                    safeFRCP(mpx, Math.floor(mp.y), mpx + mp.w, Math.floor(mp.y), 255, 150, 0); 
                }
            }
            for (let fp of lvl4FragilePlats) {
                if (!fp.active) continue;
                let fpx = Math.floor(fp.x - camX);
                let shake = (fp.touchTimer > 0 && ram[24].st % 2 === 0) ? 1 : 0;
                let rCol = (fp.touchTimer > 0) ? 255 : 200;
                let gCol = (fp.touchTimer > 0) ? 50 : 200;
                safeFRCP(fpx, fp.y + shake, fpx + fp.w, fp.y + fp.h + shake, rCol, gCol, gCol);
            }
            for (let b of lvl3SturdyBlocks) {
                safeFRCP(b.x - camX, b.y, b.x + b.w - camX, b.y + b.h, 20, 30, 40); 
                safeFRCP(b.x - camX, b.y, b.x + b.w - camX, b.y, 0, 150, 255); 
            }
        }

        for (let p of gameParticles) {
            p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
            safeFCP(p.x - camX, p.y, p.r, p.g, p.b);
        }
        gameParticles = gameParticles.filter(p => p.life > 0);

        for (let orb of levelOrbs) {
            if (orb.picked) continue;
            let orbx = Math.floor(orb.x - camX);
            let hoverY = Math.floor(orb.y + Math.sin(animTimer + orb.x) * 1.5);
            let pulseSize = (ram[24].st % 6 < 3) ? 2 : 1;
            safeFRCP(orbx, hoverY, orbx + pulseSize, hoverY + pulseSize, 0, 200, 255); safeFCP(orbx + 1, hoverY, 255, 255, 255);
        }
        
        let keyX = 1020; let keyY = 32;
        if (currentLvl === 2 && ram[41].st === 0) {
            let keyScreenX = Math.floor(keyX - camX);
            let hoverKeyY = Math.floor(keyY + Math.sin(animTimer) * 1.2);
            let kFlash = (ram[24].st % 8 < 4) ? [255, 50, 255] : [255, 215, 0];
            safeFRCP(keyScreenX, hoverKeyY, keyScreenX + 3, hoverKeyY + 4, kFlash[0], kFlash[1], kFlash[2]);
        }

        for (let enemy of activeEnemies) {
            if (!enemy.alive) continue;
            let erx = Math.floor(enemy.x - camX);
            // ENEMY BOUNDS CHECK RESTORED
            if (erx >= -4 && erx < 64) {
                if (enemy.type === 'ground') { 
                    let squash = (ram[24].st % 10 < 5) ? 4 : 3;
                    safeFRCP(erx, enemy.y + (4 - squash), erx + 4, enemy.y + 4, 230, 40, 40); safeFCP(erx + 1, enemy.y + 1, 255, 255, 255); 
                } else if (enemy.type === 'fly') {
                    let flap = (ram[24].st % 6 < 3) ? 1 : 3;
                    safeFRCP(erx, enemy.y, erx + 4, enemy.y + 2, 160, 60, 240); safeFRCP(erx + 1, enemy.y - 1, erx + 2, enemy.y - flap + 1, 255, 255, 255); 
                } else if (enemy.type === 'hunter') {
                    let bodyColor = (enemy.state === 'chase') ? [255, 0, 0] : ((enemy.state === 'alert') ? [255, 140, 0] : [240, 200, 0]);
                    safeFRCP(erx, enemy.y, erx + 4, enemy.y + 4, bodyColor[0], bodyColor[1], bodyColor[2]);
                    let eyeOffset = (enemy.dir === 1) ? 3 : 0; safeFRCP(erx + eyeOffset, enemy.y + 1, erx + eyeOffset, enemy.y + 2, 255, 255, 255);
                }
            }
        }

        for (let p of activePlayers) {
            let pAct = p === 2 ? 53 : 32; let pX = p === 2 ? 51 : 27; let pY = p === 2 ? 52 : 28;
            if (ram[pAct].st !== 0) {
                let pCol = p === 2 ? [255, 100, 100] : [255, 240, 60];
                safeFRCP(ram[pX].st - camX, ram[pY].st, ram[pX].st + 3 - camX, ram[pY].st + 1, pCol[0], pCol[1], pCol[2]); 
            }
        }

        let goalFlash = (ram[24].st % 8 < 4) ? [0, 255, 200] : [0, 130, 140];
        safeFRCP(goalX - camX, 36, (goalX + 8) - camX, 55, goalFlash[0], goalFlash[1], goalFlash[2]);
        
        let p1Goal = ram[21].st + 5 >= goalX;
        let p2Goal = (ram[47].st === 2) && (ram[48].st + 5 >= goalX);
        if (p1Goal || p2Goal) { changeGameState(4); }

        if (currentLvl === 2) {
            let altX = 30; let altY = 4; let altCamX = Math.floor(altX - camX);
            if (ram[41].st === 1) { 
                let altFlash = (ram[24].st % 8 < 4) ? [255, 50, 255] : [180, 0, 180];
                safeFRCP(altCamX, altY, altCamX + 8, altY + 12, altFlash[0], altFlash[1], altFlash[2]); 
                safeFRCP(altCamX + 2, altY + 2, altCamX + 6, altY + 10, 0, 0, 0); 
                
                let p1Sec = ram[21].st + 5 >= altX && ram[21].st <= altX + 8 && ram[22].st + 5 <= altY + 12 && ram[22].st >= altY;
                let p2Sec = (ram[47].st === 2) && ram[48].st + 5 >= altX && ram[48].st <= altX + 8 && ram[49].st + 5 <= altY + 12 && ram[49].st >= altY;
                
                if (p1Sec || p2Sec) {
                    ram[36].st = 1; changeGameState(5); 
                }
            } else { 
                safeFRCP(altCamX, altY, altCamX + 8, altY + 12, 35, 10, 35); 
            }
        }

        for (let pNum of activePlayers) {
            let rx = pNum === 2 ? 48 : 21; let ry = pNum === 2 ? 49 : 22;
            let rIFrame = pNum === 2 ? 54 : 39; let rFace = pNum === 2 ? 58 : 57;

            let pScreenX = Math.floor(ram[rx].st - camX); let pScreenY = Math.floor(ram[ry].st);
            
            // PLAYER BOUNDS CHECK RESTORED
            if (pScreenX >= -5 && pScreenX < 64) {
                if (ram[rIFrame].st === 0 || ram[24].st % 6 < 3) { 
                    let suitR = (ram[38].st > 0) ? 255 : (pNum === 2 ? 255 : 0); 
                    let suitG = (ram[38].st > 0) ? 215 : (pNum === 2 ? 50 : 220);
                    let suitB = (ram[38].st > 0) ? 255 : (pNum === 2 ? 50 : 255);
                    
                    safeFRCP(pScreenX, pScreenY, pScreenX + 5, pScreenY + 5, suitR, suitG, suitB); 
                    
                    if (ram[24].st % 8 < 4) {
                        safeFRCP(pScreenX, pScreenY + 5, pScreenX + 1, pScreenY + 5, 40, 40, 40);
                        safeFRCP(pScreenX + 4, pScreenY + 5, pScreenX + 5, pScreenY + 5, 40, 40, 40);
                    } else {
                        safeFRCP(pScreenX + 1, pScreenY + 5, pScreenX + 4, pScreenY + 5, 20, 20, 20);
                    }
                    let eyeX = (ram[rFace].st === 1) ? pScreenX + 3 : pScreenX + 1;
                    safeFRCP(eyeX, pScreenY + 1, eyeX + 1, pScreenY + 2, 255, 255, 255); 
                }
            }
        }

        safeFRCP(0, 0, 63, 6, 12, 12, 18);
        drawText("LV" + (currentLvl === 5 ? "S" : currentLvl), 2, 1, 255, 255, 255);
        drawText("*" + ram[33].st, 44, 1, 0, 255, 200); 
    }

    else if (ram[20].st === 3) {
        safeFRCP(0, 0, 63, 63, 45, 12, 12); 
        drawText("GAME", 24, 20, 255, 60, 60); drawText("OVER", 24, 28, 255, 60, 60);
        if (ram[24].st % 20 < 10) { drawText("START TO RETRY", 4, 46, 255, 255, 255); }
        if (ram[7].st === true && ram[26].st === 0) { 
            ram[26].st = 1; ram[21].st = 10; ram[22].st = 30; ram[23].st = 0; ram[25].st = 0; ram[32].st = 0; ram[57].st = 1;
            if (ram[47].st === 2) { ram[48].st = 20; ram[49].st = 30; ram[50].st = 0; ram[53].st = 0; ram[58].st = 1; }
            initLevelAssets(ram[29].st); changeGameState(2);
        }
    }

    else if (ram[20].st === 4) {
        safeFRCP(0, 0, 63, 63, 10, 45, 25); 
        drawText("STAGE", 22, 16, 255, 255, 40); drawText("CLEAR", 22, 24, 255, 255, 40);
        drawText("WELL PLAYED", 10, 36, 255, 255, 255);
        if (ram[24].st % 20 < 10) { drawText("START MAP", 15, 52, 200, 255, 255); }
        if (ram[7].st === true && ram[26].st === 0) { 
            ram[46].st = 1; ram[26].st = 1; changeGameState(1); 
        }
    }

    if (stateTransitionTimer > 0) {
        if (stateTransitionTimer < 8) {
            let lineSize = stateTransitionTimer * 8; safeFRCP(0, 0, 63, lineSize - 1, 0, 0, 0); stateTransitionTimer++;
        } else if (stateTransitionTimer === 8) {
            ram[20].st = targetState; safeFRCP(0, 0, 63, 63, 0, 0, 0); stateTransitionTimer++;
        } else if (stateTransitionTimer > 8 && stateTransitionTimer < 16) {
            let wipeOffset = (stateTransitionTimer - 8) * 8; safeFRCP(0, wipeOffset, 63, 63, 0, 0, 0); stateTransitionTimer++;
        } else { stateTransitionTimer = 0; }
    }

}, 30);