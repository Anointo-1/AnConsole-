// ============================================================================
//   ANOINTO LOGIC SYSTEMS: SCROLLER ENGINE v10.0 [LEVEL 4 & PROGRESSION UPDATE]
// ============================================================================

if (vram.length !== 64) {
    vram.length = 0; 
    for (let y = 0; y < 64; y++) {
        let row = [];
        for (let x = 0; x < 64; x++) { row.push([0, 0, 0]); }
        vram.push(row);
    }
}

let playerFacing = 1;
let animTimer = 0;
let stateTransitionTimer = 0;
let targetState = 0;

// EASTER EGG TRACKER (A, B, Up, Right, Down, Left, Select, Start)
let lastInput = -1;
let cheatCode = [0, 1, 2, 5, 3, 4, 7, 6]; 
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

// GLOBAL GAME MEMORY MAP
ram[20].st = 0; // Main State
ram[29].st = 1; // Current Level Select (1=L1, 2=L2, 3=L3, 4=L4, 5=S-Level)
ram[33].st = 0; // Orbs
ram[34].st = 0; // Pause Master
ram[35].st = 0; // Pause Option
ram[36].st = 0; // Secret Unlocked Flag
ram[37].st = 1; // Theme Style
ram[38].st = 0; // Armor Flag
ram[39].st = 0; // I-Frames Timer
ram[40].st = 0; // Level Width
ram[41].st = 0; // Secret Key Status
ram[42].st = 0; // Jump Tracking
ram[43].st = 0; // Map Camera X Interpolation
ram[44].st = 0; // BGM Sequencer Tick
ram[46].st = 0; // PROGRESSION LOCK: 1 if ANY level is beaten!

// LEVEL 1 & 2 STATIC DATA
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

// DYNAMIC ENGINE STORAGE
let levelOrbs = [];
let activeEnemies = [];
let specialPlatforms = [];
let specialSprings = [];
let lvl3Slopes = [];
let lvl3SturdyBlocks = [];
let lvl3Hazards = [];
let lvl4MovingPlats = [];
let lvl4FragilePlats = [];

// BACKGROUND MUSIC SEQUENCES
const bgm1 = ["C4", "", "E4", "", "G4", "", "C5", "", "G4", "", "E4", ""];
const bgm2 = ["D3", "", "F3", "", "A3", "", "D4", "", "A3", "", "F3", ""];
const bgm3 = ["E3", "E3", "G3", "", "B3", "B3", "E4", "", "C4", "", "G3", ""];
const bgm4 = ["F4", "A4", "C5", "A4", "F4", "E4", "G4", "C5"]; // New Level 4 Tech BGM
const bgmS = ["A4", "C5", "E5", "A5", "E5", "C5"]; // Special Level BGM

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
        // NEW LEVEL 4 (20 SCREENS: 1280px) - MOVING PLATFORMS & FRAGILE BLOCKS
        ram[40].st = 1280; ram[37].st = 4;
        
        specialPlatforms.push({x1: 0, x2: 50, y: 48, h: 16}); // Safe Start
        
        // Sticky Horizontal Mover + Sturdy Block
        lvl4MovingPlats.push({x: 60, y: 40, w: 24, h: 4, type: 'sticky', path: 'horiz', cx: 80, cy: 40, radius: 20, speed: 0.04, timer: 0});
        lvl3SturdyBlocks.push({x: 80, y: 20, w: 10, h: 10}); // Floating sturdy obstacle to dodge while moving!
        
        // Fragile Platform Bridge
        lvl4FragilePlats.push({x: 120, y: 36, w: 16, h: 4, active: true, touchTimer: 0});
        lvl4FragilePlats.push({x: 140, y: 36, w: 16, h: 4, active: true, touchTimer: 0});
        
        // Slidable Vertical Mover (Doesn't carry player, must jump!)
        lvl4MovingPlats.push({x: 170, y: 30, w: 16, h: 4, type: 'slide', path: 'vert', cx: 170, cy: 30, radius: 15, speed: 0.06, timer: 0});
        
        specialPlatforms.push({x1: 200, x2: 240, y: 20, h: 4});
        activeEnemies.push({type: 'hunter', x: 215, y: 10, vy: 0, minX: 200, maxX: 235, dir: 1, state: 'patrol', alertTimer: 0, alive: true});
        
        // Slope down into a massive circular moving platform
        lvl3Slopes.push({x1: 240, x2: 260, y1: 20, y2: 48});
        specialPlatforms.push({x1: 260, x2: 280, y: 48, h: 16});
        
        lvl4MovingPlats.push({x: 320, y: 40, w: 20, h: 4, type: 'sticky', path: 'circ', cx: 320, cy: 30, radius: 20, speed: 0.03, timer: 0});
        levelOrbs.push({x: 320, y: 10, picked: false});

        // Procedural expansion for the rest of Level 4
        let cx = 370;
        while (cx < 1180) {
            let roll = Math.random();
            if (roll < 0.33) {
                // Sticky Horiz Gap
                specialPlatforms.push({x1: cx, x2: cx + 20, y: 40, h: 4});
                lvl4MovingPlats.push({x: cx + 30, y: 40, w: 16, h: 4, type: 'sticky', path: 'horiz', cx: cx + 45, cy: 40, radius: 15, speed: 0.05, timer: Math.random()*10});
                specialPlatforms.push({x1: cx + 70, x2: cx + 90, y: 40, h: 4});
                cx += 100;
            } else if (roll < 0.66) {
                // Crumbling Sturdy Tunnel!
                lvl4FragilePlats.push({x: cx, y: 48, w: 40, h: 4, active: true, touchTimer: 0});
                lvl3SturdyBlocks.push({x: cx+10, y: 30, w: 20, h: 12}); 
                activeEnemies.push({type: 'fly', x: cx + 20, baseY: 15, timer: 0, alive: true});
                cx += 60;
            } else {
                // Slidable Vertical Challenge
                lvl4MovingPlats.push({x: cx, y: 40, w: 16, h: 4, type: 'slide', path: 'vert', cx: cx, cy: 35, radius: 15, speed: 0.06, timer: Math.random()*5});
                lvl4MovingPlats.push({x: cx + 30, y: 20, w: 16, h: 4, type: 'slide', path: 'vert', cx: cx + 30, cy: 30, radius: 15, speed: 0.05, timer: Math.random()*5});
                levelOrbs.push({x: cx + 35, y: 10, picked: false});
                cx += 60;
            }
        }
        specialPlatforms.push({x1: 1180, x2: 1280, y: 40, h: 16});

    } else if (lvl === 5) { // SPECIAL LEVEL (FORMERLY LEVEL 4)
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
    'E': [1,1,1, 1,0,0, 1,1,1, 1,0,0, 1,1,1], 'G': [1,1,1, 1,0,0, 1,0,1, 1,0,1, 1,1,1],
    'I': [1,1,1, 0,1,0, 0,1,0, 0,1,0, 1,1,1], 'L': [1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,1,1],
    'M': [1,0,1, 1,1,1, 1,0,1, 1,0,1, 1,0,1], 'N': [1,0,1, 1,1,1, 1,1,1, 1,0,1, 1,0,1],
    'O': [1,1,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1], 'P': [1,1,1, 1,0,1, 1,1,1, 1,0,0, 1,0,0],
    'Q': [1,1,1, 1,0,1, 1,0,1, 1,1,1, 0,0,1], 'R': [1,1,1, 1,0,1, 1,1,1, 1,1,0, 1,0,1],
    'S': [1,1,1, 1,0,0, 1,1,1, 0,0,1, 1,1,1], 'T': [1,1,1, 0,1,0, 0,1,0, 0,1,0, 0,1,0],
    'U': [1,0,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1], 'V': [1,0,1, 1,0,1, 1,0,1, 1,0,1, 0,1,0],
    'W': [1,0,1, 1,0,1, 1,0,1, 1,1,1, 1,0,1], 'X': [1,0,1, 1,0,1, 0,1,0, 1,0,1, 1,0,1],
    'Y': [1,0,1, 1,0,1, 0,1,0, 0,1,0, 0,1,0], '1': [0,1,0, 1,1,0, 0,1,0, 0,1,0, 1,1,1], 
    '2': [1,1,1, 0,0,1, 1,1,1, 1,0,0, 1,1,1], '3': [1,1,1, 0,0,1, 1,1,1, 0,0,1, 1,1,1],
    '4': [1,0,1, 1,0,1, 1,1,1, 0,0,1, 0,0,1], '5': [1,1,1, 1,0,0, 1,1,1, 0,0,1, 1,1,1],
    '6': [1,1,1, 1,0,0, 1,1,1, 1,0,1, 1,1,1], '7': [1,1,1, 0,0,1, 0,1,0, 0,1,0, 0,1,0],
    '8': [1,1,1, 1,0,1, 1,1,1, 1,0,1, 1,1,1], '9': [1,1,1, 1,0,1, 1,1,1, 0,0,1, 1,1,1],
    '0': [1,1,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1], ':': [0,0,0, 0,1,0, 0,0,0, 0,1,0, 0,0,0], 
    ' ': [0,0,0, 0,0,0, 0,0,0, 0,0,0, 0,0,0], '-': [0,0,0, 0,0,0, 1,1,1, 0,0,0, 0,0,0]
};

function drawText(str, startX, startY, r, g, b) {
    let curX = startX;
    for (let i = 0; i < str.length; i++) {
        let glyph = miniFont[str[i].toUpperCase()] || miniFont[' '];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 3; col++) {
                if (glyph[row * 3 + col] === 1) {
                    let outX = curX + col; let outY = startY + row;
                    if (outX >= 0 && outX < 64 && outY >= 0 && outY < 64) { fcp(outX, outY, r, g, b); }
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

    if (ram[39].st > 0) { ram[39].st--; }
    if (ram[26].st === 1) {
        if (!ram[6].st && !ram[0].st && !ram[1].st && !ram[7].st && !ram[2].st && !ram[3].st && !ram[4].st && !ram[5].st) { ram[26].st = 0; }
    }

    // STATE 0: BOOT / TITLE SCREEN (WITH EASTER EGG LOGIC)
    if (ram[20].st === 0) {
        frcp(0, 0, 63, 63, 20, 20, 35); 
        drawText("ANOINTO", 18, 14, 0, 255, 180); drawText("GEAR", 24, 23, 0, 180, 255);
        let dynamicY = Math.floor(45 + Math.sin(animTimer) * 1.5);
        if (ram[24].st % 20 < 10) { drawText("START", 22, dynamicY, 255, 215, 0); }

        let currentInput = -1;
        for (let i = 0; i < 8; i++) { if (ram[i].st) currentInput = i; }
        if (currentInput !== -1 && currentInput !== lastInput) {
            if (currentInput === cheatCode[cheatProgress]) {
                cheatProgress++;
                if (cheatProgress === 8) {
                    ram[38].st = 1; 
                    ram[26].st = 1; ram[29].st = 1; changeGameState(1); 
                    if (typeof playNote === "function") { playNote("E6", 0.05); playNote("G6", 0.1, 0.05); }
                    cheatProgress = 0;
                }
            } else { cheatProgress = 0; }
        }
        lastInput = currentInput;

        if (ram[6].st === true && ram[26].st === 0 && cheatProgress !== 8) { 
            ram[26].st = 1; ram[29].st = 1; changeGameState(1); 
            if (typeof playNote === "function") { playNote("C4", 0.06); playNote("E4", 0.06, 0.05); }
        }
    }

    // STATE 1: MAP SELECTOR (ANIMATED SCROLLING WITH LOCKS)
    else if (ram[20].st === 1) {
        frcp(0, 0, 63, 63, 15, 15, 25);
        
        // Navigation Input Logic
        if (ram[4].st === true && ram[26].st === 0) { // LEFT
            ram[26].st = 1;
            if (ram[29].st === 3) ram[29].st = 2; else if (ram[29].st === 2) ram[29].st = 1; else if (ram[29].st === 4) ram[29].st = 3;
            if (typeof playNote === "function") playNote("F4", 0.04);
        }
        if (ram[5].st === true && ram[26].st === 0) { // RIGHT
            ram[26].st = 1;
            if (ram[29].st === 1) ram[29].st = 2; 
            else if (ram[29].st === 2 && ram[46].st === 1) ram[29].st = 3; // PROGRESSION LOCK!
            else if (ram[29].st === 3) ram[29].st = 4;
            if (typeof playNote === "function") playNote("F4", 0.04);
        }
        if (ram[2].st === true && ram[26].st === 0 && ram[36].st === 1) { // UP
            if (ram[29].st === 1 || ram[29].st === 2) {
                ram[26].st = 1; ram[29].st = 5; // Special Level is 5!
                if (typeof playNote === "function") playNote("A4", 0.04);
            }
        }
        if (ram[3].st === true && ram[26].st === 0) { // DOWN
            if (ram[29].st === 5) {
                ram[26].st = 1; ram[29].st = 2;
                if (typeof playNote === "function") playNote("F4", 0.04);
            }
        }

        let targetMapCamX = (ram[29].st === 3 || ram[29].st === 4) ? 64 : 0;
        ram[43].st += (targetMapCamX - ram[43].st) * 0.20; 
        let mCamX = Math.floor(ram[43].st);

        for (let i = 0; i < 128; i += 16) { frcp(i - mCamX, 0, i - mCamX, 63, 22, 22, 35); }
        
        frcp(14 - mCamX, 34, 28 - mCamX, 35, 80, 80, 100); // 1 to 2
        
        if (ram[46].st === 1) {
            frcp(34 - mCamX, 34, 74 - mCamX, 35, 80, 80, 100); // 2 to 3 (Page bridge)
            frcp(78 - mCamX, 34, 92 - mCamX, 35, 80, 80, 100); // 3 to 4
        } else {
            drawText("LOCKED", 40 - mCamX, 24, 255, 50, 50);
        }

        if (ram[36].st === 1) {
            frcp(30 - mCamX, 16, 32 - mCamX, 31, 80, 80, 100); // Up to S
            let nSColor = (ram[29].st === 5) ? [255, 0, 255] : [100, 100, 100];
            frcp(28 - mCamX, 10, 34 - mCamX, 16, nSColor[0], nSColor[1], nSColor[2]);
            drawText("S", 30 - mCamX, 3, 255, 255, 255);
        }

        let n1Color = (ram[29].st === 1) ? [0, 255, 150] : [100, 100, 100];
        frcp(8 - mCamX, 31, 14 - mCamX, 37, n1Color[0], n1Color[1], n1Color[2]); drawText("1", 10 - mCamX, 24, 255, 255, 255);
        
        let n2Color = (ram[29].st === 2) ? [240, 90, 40] : [100, 100, 100];
        frcp(28 - mCamX, 31, 34 - mCamX, 37, n2Color[0], n2Color[1], n2Color[2]); drawText("2", 30 - mCamX, 24, 255, 255, 255);
        
        if (ram[46].st === 1) {
            let n3Color = (ram[29].st === 3) ? [255, 60, 60] : [100, 100, 100];
            frcp(74 - mCamX, 31, 80 - mCamX, 37, n3Color[0], n3Color[1], n3Color[2]); drawText("3", 76 - mCamX, 24, 255, 255, 255);
            let n4Color = (ram[29].st === 4) ? [0, 200, 255] : [100, 100, 100];
            frcp(94 - mCamX, 31, 100 - mCamX, 37, n4Color[0], n4Color[1], n4Color[2]); drawText("4", 96 - mCamX, 24, 255, 255, 255);
        }

        drawText("MAP", 4 - mCamX, 6, 255, 255, 255);
        drawText("CORE", 68 - mCamX, 6, 255, 100, 100);

        if ((ram[0].st === true || ram[6].st === true) && ram[26].st === 0) {
            ram[26].st = 1; ram[21].st = 10; ram[22].st = 30; ram[23].st = 0; ram[25].st = 0; ram[32].st = 0; ram[34].st = 0; 
            initLevelAssets(ram[29].st);
            changeGameState(2);  
            if (typeof playNote === "function") { playNote("C5", 0.05); playNote("C6", 0.15, 0.10); }
        }
    }

    // STATE 2: ACTIVE WORLD GAMEPLAY
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
            if (typeof playNote === "function") playNote("B4", 0.05);
        }

        if (ram[34].st === 1) {
            if ((ram[2].st === true || ram[3].st === true) && ram[26].st === 0) {
                ram[26].st = 1; ram[35].st = (ram[35].st === 0) ? 1 : 0; 
                if (typeof playNote === "function") playNote("E4", 0.04);
            }
            if (ram[6].st === true && ram[26].st === 0) {
                ram[26].st = 1;
                if (ram[35].st === 0) { ram[34].st = 0; if (typeof playNote === "function") playNote("G4", 0.06); } 
                else { changeGameState(1); if (typeof playNote === "function") playNote("D4", 0.1); }
            }
            frcp(8, 12, 55, 52, 10, 10, 15); drawText("PAUSED", 20, 16, 255, 255, 0);
            drawText("RESUME", 18, 28, (ram[35].st === 0 ? 0 : 150), (ram[35].st === 0 ? 255 : 150), 150);
            drawText("QUIT", 22, 38, (ram[35].st === 1 ? 255 : 150), (ram[35].st === 1 ? 50 : 150), 150);
            return; 
        }

        // --- PLATFORM MOVEMENT UPDATE ENGINE (LEVEL 4) ---
        for (let mp of lvl4MovingPlats) {
            let oldX = mp.x; let oldY = mp.y;
            mp.timer += mp.speed;
            if (mp.path === 'horiz') { mp.x = mp.cx + Math.sin(mp.timer) * mp.radius; } 
            else if (mp.path === 'vert') { mp.y = mp.cy + Math.sin(mp.timer) * mp.radius; } 
            else if (mp.path === 'circ') { mp.x = mp.cx + Math.cos(mp.timer) * mp.radius; mp.y = mp.cy + Math.sin(mp.timer) * mp.radius; }
            mp.dx = mp.x - oldX; mp.dy = mp.y - oldY;
        }

        let isMoving = false;
        if (ram[4].st === true && ram[21].st > 0) { ram[21].st -= 1.6; playerFacing = -1; isMoving = true; }
        if (ram[5].st === true && ram[21].st < (maxWorldWidth - 6)) { ram[21].st += 1.6; playerFacing = 1; isMoving = true; }

        if (ram[1].st === true && ram[32].st === 0 && ram[26].st === 0) {
            ram[26].st = 1; ram[32].st = playerFacing;
            ram[27].st = ram[21].st + (playerFacing === 1 ? 6 : -4); ram[28].st = ram[22].st + 2;
            if (typeof playNote === "function") { playNote("G5", 0.03); playNote("C5", 0.04, 0.02); }
        }
        if (ram[32].st !== 0) {
            ram[27].st += (3.8 * ram[32].st);
            if (Math.abs(ram[27].st - ram[21].st) > 55) { ram[32].st = 0; }
        }

        ram[23].st += 0.52; 
        if (ram[23].st > 4.5) ram[23].st = 4.5; 
        ram[22].st += ram[23].st; 

        let pLeft = ram[21].st; let pRight = ram[21].st + 5;
        let pBottom = ram[22].st + 5; let oldBottom = pBottom - ram[23].st; 
        let isGrounded = false;

        if (currentLvl !== 5 && currentLvl !== 3 && currentLvl !== 4 && pBottom >= 56) { ram[22].st = 51; ram[23].st = 0; isGrounded = true; }
        if (ram[22].st > 64) { 
            changeGameState(3); 
            if (typeof playNote === "function") { playNote("C3", 0.1); playNote("G2", 0.15, 0.08); playNote("C2", 0.3, 0.18); }
        }

        let currentPlats = (currentLvl === 1) ? lvl1Platforms : (currentLvl === 2 ? lvl2Platforms : specialPlatforms);
        let currentSprings = (currentLvl === 1 || currentLvl === 3 || currentLvl === 4 || currentLvl === 5) ? [] : lvl2Springs;

        // Base Platforms
        for (let plat of currentPlats) {
            if (ram[23].st >= 0 && pRight >= plat.x1 && pLeft <= plat.x2) {
                if (oldBottom <= plat.y && pBottom >= plat.y) {
                    ram[22].st = plat.y - 5; ram[23].st = 0; isGrounded = true;
                }
            }
        }

        // Level 3 & 4 Complex Geometry
        if (currentLvl === 3 || currentLvl === 4) {
            for (let slope of lvl3Slopes) {
                if (pRight >= slope.x1 && pLeft <= slope.x2) {
                    let pMidX = (pLeft + pRight) / 2;
                    let t = (pMidX - slope.x1) / (slope.x2 - slope.x1);
                    if (t < 0) t = 0; if (t > 1) t = 1;
                    let slopeSurfaceY = slope.y1 + t * (slope.y2 - slope.y1);
                    if (ram[23].st >= 0 && oldBottom <= slopeSurfaceY + 4 && pBottom >= slopeSurfaceY) {
                        ram[22].st = slopeSurfaceY - 5; ram[23].st = 0; isGrounded = true;
                    }
                }
            }
            let pX = ram[21].st; let pY = ram[22].st; let pW = 5; let pH = 5;
            for (let b of lvl3SturdyBlocks) {
                if (pX + pW > b.x && pX < b.x + b.w && pY + pH > b.y && pY < b.y + b.h) {
                    let overlapX = (pX + pW / 2 < b.x + b.w / 2) ? (pX + pW - b.x) : (b.x + b.w - pX);
                    let overlapY = (pY + pH / 2 < b.y + b.h / 2) ? (pY + pH - b.y) : (b.y + b.h - pY);
                    if (overlapX < overlapY) {
                        if (pX + pW / 2 < b.x + b.w / 2) { ram[21].st = b.x - pW; } else { ram[21].st = b.x + b.w; }
                    } else {
                        if (pY + pH / 2 < b.y + b.h / 2) { ram[22].st = b.y - pH; ram[23].st = 0; isGrounded = true; } 
                        else { ram[22].st = b.y + b.h; if (ram[23].st < 0) ram[23].st = 0; }
                    }
                }
            }
            
            // LEVEL 4 MOVING & FRAGILE LOGIC
            if (currentLvl === 4) {
                for (let mp of lvl4MovingPlats) {
                    if (ram[23].st >= 0 && pRight >= mp.x && pLeft <= mp.x + mp.w) {
                        if (oldBottom <= mp.y + 4 && pBottom >= mp.y) {
                            ram[22].st = mp.y - 5; ram[23].st = 0; isGrounded = true;
                            if (mp.type === 'sticky') { ram[21].st += mp.dx; } // Carry the player!
                        }
                    }
                }
                for (let fp of lvl4FragilePlats) {
                    if (!fp.active) continue;
                    if (ram[23].st >= 0 && pRight >= fp.x && pLeft <= fp.x + fp.w) {
                        if (oldBottom <= fp.y + 4 && pBottom >= fp.y) {
                            ram[22].st = fp.y - 5; ram[23].st = 0; isGrounded = true;
                            fp.touchTimer++;
                            if (fp.touchTimer > 30) {
                                fp.active = false; // Break!
                                spawnSparkBurst(fp.x + fp.w/2, fp.y, 255, 255, 255, 8);
                                if (typeof playNote === "function") playNote("F3", 0.1);
                            }
                        }
                    }
                }
            }
        }

        for (let spring of currentSprings) {
            if (pRight >= spring.x && pLeft <= (spring.x + spring.width)) {
                if (pBottom >= spring.y && ram[22].st <= spring.y + 2) { 
                    ram[23].st = -7.8; spawnSparkBurst(spring.x + 3, spring.y, 255, 255, 0, 4);
                    if (typeof playNote === "function") { playNote("D4", 0.05); playNote("G4", 0.05, 0.03); }
                }
            }
        }

        if (ram[0].st === true && isGrounded) { 
            ram[23].st = -5.4; ram[42].st = 1; 
            if (typeof playNote === "function") { playNote("F4", 0.06); playNote("A4", 0.12, 0.03); }
        } 
        if (ram[0].st === false && ram[23].st < -1.8 && ram[42].st === 1) { ram[23].st = -1.8; ram[42].st = 0; }

        for (let orb of levelOrbs) {
            if (!orb.picked && pRight >= orb.x && pLeft <= orb.x + 3 && pBottom >= orb.y && ram[22].st <= orb.y + 3) {
                orb.picked = true; ram[33].st++; spawnSparkBurst(orb.x + 1, orb.y + 1, 0, 200, 255, 6);
                if (typeof playNote === "function") { playNote("E6", 0.04); playNote("B6", 0.10, 0.03); }
            }
        }

        let keyX = 1020; let keyY = 32;
        if (currentLvl === 2 && ram[41].st === 0) {
            if (pRight >= keyX && pLeft <= keyX + 4 && pBottom >= keyY && ram[22].st <= keyY + 4) {
                ram[41].st = 1; spawnSparkBurst(keyX + 2, keyY + 2, 255, 50, 255, 12);
                if (typeof playNote === "function") { playNote("G5", 0.06); playNote("E6", 0.06, 0.10); }
            }
        }

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
                    if (Math.abs(ram[22].st - enemy.y) < 16 && Math.abs(ram[21].st - enemy.x) < 55) {
                        enemy.state = 'alert'; enemy.alertTimer = 12; enemy.vy = -2.2; 
                        spawnSparkBurst(enemy.x + 2, enemy.y, 255, 100, 0, 3);
                    }
                } else if (enemy.state === 'alert') {
                    enemy.alertTimer--; if (enemy.alertTimer <= 0) { enemy.state = 'chase'; }
                } else if (enemy.state === 'chase') {
                    if (ram[21].st > enemy.x) { enemy.x += 0.85; enemy.dir = 1; } else { enemy.x -= 0.85; enemy.dir = -1; }
                    if (ram[22].st < enemy.y - 12 && eGrounded && Math.random() < 0.06) { enemy.vy = -4.5; }
                }
            }

            let ex = enemy.x; let ey = enemy.y; let ew = 4; let eh = 4;
            if (ram[32].st !== 0 && ram[27].st + 3 >= ex && ram[27].st <= ex + ew && ram[28].st + 1 >= ey && ram[28].st <= ey + eh) {
                enemy.alive = false; ram[32].st = 0; spawnSparkBurst(ex + 2, ey + 2, 255, 50, 50, 8);
                if (typeof playNote === "function") { playNote("C3", 0.05); playNote("A2", 0.05, 0.03); }
                continue;
            }

            if (pRight >= ex && pLeft <= ex + ew && pBottom >= ey && ram[22].st <= ey + eh) {
                if (ram[23].st > 0 && oldBottom <= ey + 1) {
                    enemy.alive = false; ram[23].st = -4.2; spawnSparkBurst(ex + 2, ey + 2, 255, 255, 255, 8);
                    if (typeof playNote === "function") { playNote("E5", 0.04); playNote("C5", 0.06, 0.03); }
                } else if (ram[39].st === 0) { 
                    if (ram[38].st > 0) {
                        ram[38].st = 0; ram[39].st = 60; ram[23].st = -4.0; spawnSparkBurst(ram[21].st + 2, ram[22].st + 2, 0, 255, 255, 10);
                        if (typeof playNote === "function") { playNote("G#3", 0.08); }
                    } else {
                        changeGameState(3); 
                        if (typeof playNote === "function") { playNote("D3", 0.12); playNote("F2", 0.30, 0.16); }
                    }
                }
            }
        }

        gameParticles = gameParticles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
            return p.life > 0;
        });

        let idealCamX = ram[21].st - 29;
        if (idealCamX < 0) idealCamX = 0;
        if (idealCamX > (maxWorldWidth - 64)) idealCamX = (maxWorldWidth - 64); 
        ram[25].st = idealCamX; let camX = ram[25].st;

        if (currentLvl === 1 || currentLvl === 5) {
            frcp(0, 0, 63, 63, 12, 14, 24); 
            let starOffset = Math.floor((camX * 0.12) % 64); fcp((20 - starOffset + 64) % 64, 12, 110, 110, 150); fcp((50 - starOffset + 64) % 64, 22, 90, 90, 130);
            let mountOffset = Math.floor((camX * 0.30) % 64); for (let m = -16; m < 80; m += 24) { frcp(m - mountOffset, 48, m - mountOffset + 12, 55, 26, 30, 46); }
            if (currentLvl === 1) frcp(Math.floor(0 - camX), 56, Math.floor(maxWorldWidth - camX), 63, 35, 45, 60);
            for (let plat of currentPlats) { frcp(Math.floor(plat.x1 - camX), plat.y, Math.floor(plat.x2 - camX), plat.y + plat.h, 0, 170, 120); }
        } else if (currentLvl === 2) {
            frcp(0, 0, 63, 63, 30, 14, 10); 
            let pipesOffset = Math.floor((camX * 0.35) % 64); for (let p = -8; p < 70; p += 20) { frcp(p - pipesOffset, 0, p - pipesOffset + 2, 55, 45, 25, 18); }
            frcp(Math.floor(0 - camX), 56, Math.floor(maxWorldWidth - camX), 63, 65, 30, 20); 
            for (let plat of currentPlats) { frcp(Math.floor(plat.x1 - camX), plat.y, Math.floor(plat.x2 - camX), plat.y + plat.h, 190, 80, 40); }
            for (let spring of currentSprings) { frcp(Math.floor(spring.x - camX), spring.y, Math.floor(spring.x + spring.width - camX), spring.y + 2, 240, 220, 30); }
        } else if (currentLvl === 3) {
            frcp(0, 0, 63, 63, 18, 8, 8); 
            let ashOffset = Math.floor((camX * 0.20) % 64);
            fcp((15 - ashOffset + 64) % 64, 15, 200, 100, 0); fcp((45 - ashOffset + 64) % 64, 30, 180, 80, 0);
            
            for (let slope of lvl3Slopes) {
                let step = (slope.x2 - slope.x1);
                for (let sx = 0; sx <= step; sx++) {
                    let ry = Math.floor(slope.y1 + (sx / step) * (slope.y2 - slope.y1));
                    let scrX = Math.floor((slope.x1 + sx) - camX);
                    if (scrX >= 0 && scrX < 64) { frcp(scrX, ry, scrX, 63, 110, 40, 15); fcp(scrX, ry, 255, 120, 0); }
                }
            }
            for (let plat of specialPlatforms) {
                let px = Math.floor(plat.x1 - camX); let prx = Math.floor(plat.x2 - camX);
                let drawX1 = Math.max(0, px); let drawX2 = Math.min(63, prx);
                if (drawX1 <= drawX2) {
                    frcp(drawX1, plat.y, drawX2, plat.y + plat.h, 110, 40, 15);
                    frcp(drawX1, plat.y, drawX2, plat.y + 1, 255, 120, 0);
                }
            }
            for (let b of lvl3SturdyBlocks) {
                let bx = Math.floor(b.x - camX);
                if (bx >= -20 && bx < 64) {
                    let clampX1 = Math.max(0, bx); let clampX2 = Math.min(63, bx + b.w);
                    if (clampX1 <= clampX2) { frcp(clampX1, b.y, clampX2, b.y + b.h, 50, 55, 70); frcp(clampX1, b.y, clampX2, b.y, 130, 140, 160); }
                }
            }
            for (let h of lvl3Hazards) {
                h.y += h.vy; h.vy += 0.16;
                if (h.y > h.baseY) { h.y = h.baseY; h.vy = -4.0 - Math.random() * 2.2; }
                let hx = Math.floor(h.x - camX); let hy = Math.floor(h.y);
                if (hx >= 0 && hx < 62 && hy >= 0 && hy < 62) { frcp(hx, hy, hx + 2, hy + 2, 255, 70, 0); fcp(hx + 1, hy + 1, 255, 255, 150); }
                if (pRight >= h.x && pLeft <= h.x + 3 && pBottom >= h.y && ram[22].st <= h.y + 3) { changeGameState(3); }
            }
        } else if (currentLvl === 4) {
            // SKY CITY CYBER THEME FOR LEVEL 4
            frcp(0, 0, 63, 63, 5, 10, 25); 
            let gridOffset = Math.floor((camX * 0.15) % 64);
            for (let g = 0; g < 128; g += 16) { frcp(g - gridOffset, 0, g - gridOffset, 63, 10, 25, 45); } // Vertical grid lines
            
            for (let slope of lvl3Slopes) {
                let step = (slope.x2 - slope.x1);
                for (let sx = 0; sx <= step; sx++) {
                    let ry = Math.floor(slope.y1 + (sx / step) * (slope.y2 - slope.y1));
                    let scrX = Math.floor((slope.x1 + sx) - camX);
                    if (scrX >= 0 && scrX < 64) { frcp(scrX, ry, scrX, 63, 40, 60, 90); fcp(scrX, ry, 0, 255, 200); }
                }
            }
            for (let plat of specialPlatforms) {
                let px = Math.floor(plat.x1 - camX); let prx = Math.floor(plat.x2 - camX);
                let drawX1 = Math.max(0, px); let drawX2 = Math.min(63, prx);
                if (drawX1 <= drawX2) {
                    frcp(drawX1, plat.y, drawX2, plat.y + plat.h, 40, 60, 90);
                    frcp(drawX1, plat.y, drawX2, plat.y + 1, 0, 255, 200);
                }
            }
            for (let mp of lvl4MovingPlats) {
                let mpx = Math.floor(mp.x - camX);
                if (mpx >= -30 && mpx < 64) {
                    let cX1 = Math.max(0, mpx); let cX2 = Math.min(63, mpx + mp.w);
                    if (cX1 <= cX2) {
                        if (mp.type === 'sticky') {
                            frcp(cX1, Math.floor(mp.y), cX2, Math.floor(mp.y) + mp.h, 10, 100, 100);
                            frcp(cX1, Math.floor(mp.y), cX2, Math.floor(mp.y), 0, 255, 0); // Green trim for sticky
                        } else {
                            frcp(cX1, Math.floor(mp.y), cX2, Math.floor(mp.y) + mp.h, 150, 60, 10);
                            frcp(cX1, Math.floor(mp.y), cX2, Math.floor(mp.y), 255, 150, 0); // Orange/Yellow trim for slide
                        }
                    }
                }
            }
            for (let fp of lvl4FragilePlats) {
                if (!fp.active) continue;
                let fpx = Math.floor(fp.x - camX);
                if (fpx >= -20 && fpx < 64) {
                    let cX1 = Math.max(0, fpx); let cX2 = Math.min(63, fpx + fp.w);
                    if (cX1 <= cX2) {
                        let shake = (fp.touchTimer > 0 && ram[24].st % 2 === 0) ? 1 : 0;
                        let rCol = (fp.touchTimer > 0) ? 255 : 200;
                        let gCol = (fp.touchTimer > 0) ? 50 : 200;
                        frcp(cX1, fp.y + shake, cX2, fp.y + fp.h + shake, rCol, gCol, gCol);
                    }
                }
            }
            for (let b of lvl3SturdyBlocks) {
                let bx = Math.floor(b.x - camX);
                if (bx >= -20 && bx < 64) {
                    let clampX1 = Math.max(0, bx); let clampX2 = Math.min(63, bx + b.w);
                    if (clampX1 <= clampX2) { frcp(clampX1, b.y, clampX2, b.y + b.h, 20, 30, 40); frcp(clampX1, b.y, clampX2, b.y, 0, 150, 255); }
                }
            }
        }

        for (let p of gameParticles) {
            let scrX = Math.floor(p.x - camX); let scrY = Math.floor(p.y);
            if (scrX >= 0 && scrX < 64 && scrY >= 0 && scrY < 64) { fcp(scrX, scrY, p.r, p.g, p.b); }
        }

        for (let orb of levelOrbs) {
            if (orb.picked) continue;
            let orbx = Math.floor(orb.x - camX);
            if (orbx >= 0 && orbx < 64) {
                let hoverY = Math.floor(orb.y + Math.sin(animTimer + orb.x) * 1.5);
                let pulseSize = (ram[24].st % 6 < 3) ? 2 : 1;
                frcp(orbx, hoverY, orbx + pulseSize, hoverY + pulseSize, 0, 200, 255); fcp(orbx + 1, hoverY, 255, 255, 255);
            }
        }

        if (currentLvl === 2 && ram[41].st === 0) {
            let keyScreenX = Math.floor(keyX - camX);
            if (keyScreenX >= -4 && keyScreenX < 64) {
                let hoverKeyY = Math.floor(keyY + Math.sin(animTimer) * 1.2);
                let kFlash = (ram[24].st % 8 < 4) ? [255, 50, 255] : [255, 215, 0];
                frcp(keyScreenX, hoverKeyY, keyScreenX + 3, hoverKeyY + 4, kFlash[0], kFlash[1], kFlash[2]);
            }
        }

        for (let enemy of activeEnemies) {
            if (!enemy.alive) continue;
            let erx = Math.floor(enemy.x - camX);
            if (erx >= -4 && erx < 64) {
                if (enemy.type === 'ground') { 
                    let squash = (ram[24].st % 10 < 5) ? 4 : 3;
                    frcp(erx, enemy.y + (4 - squash), erx + 4, enemy.y + 4, 230, 40, 40); fcp(erx + 1, enemy.y + 1, 255, 255, 255); 
                } else if (enemy.type === 'fly') {
                    let ery = Math.floor(enemy.y); let flap = (ram[24].st % 6 < 3) ? 1 : 3;
                    frcp(erx, ery, erx + 4, ery + 2, 160, 60, 240); frcp(erx + 1, ery - 1, erx + 2, ery - flap + 1, 255, 255, 255); 
                } else if (enemy.type === 'hunter') {
                    let ery = Math.floor(enemy.y);
                    let bodyColor = (enemy.state === 'chase') ? [255, 0, 0] : ((enemy.state === 'alert') ? [255, 140, 0] : [240, 200, 0]);
                    frcp(erx, ery, erx + 4, ery + 4, bodyColor[0], bodyColor[1], bodyColor[2]);
                    let eyeOffset = (enemy.dir === 1) ? 3 : 0; frcp(erx + eyeOffset, ery + 1, erx + eyeOffset, ery + 2, 255, 255, 255);
                }
            }
        }

        if (ram[32].st !== 0) {
            let lrx = Math.floor(ram[27].st - camX);
            if (lrx >= 0 && lrx < 64) { frcp(lrx, Math.floor(ram[28].st), lrx + 3, Math.floor(ram[28].st) + 1, 255, 240, 60); }
        }

        let goalFlash = (ram[24].st % 8 < 4) ? [0, 255, 200] : [0, 130, 140];
        frcp(Math.floor(goalX - camX), 36, Math.floor((goalX + 8) - camX), 55, goalFlash[0], goalFlash[1], goalFlash[2]);
        
        if (pRight >= goalX) { 
            if (currentLvl === 5) { ram[38].st = 1; } 
            changeGameState(4); 
            if (typeof playNote === "function") { playNote("C5", 0.08); playNote("C6", 0.35, 0.18); }
        }

        if (currentLvl === 2) {
            let altX = 30; let altY = 4; let altCamX = Math.floor(altX - camX);
            if (ram[41].st === 1) { 
                if (altCamX >= -10 && altCamX < 64) {
                    let altFlash = (ram[24].st % 8 < 4) ? [255, 50, 255] : [180, 0, 180];
                    frcp(altCamX, altY, altCamX + 8, altY + 12, altFlash[0], altFlash[1], altFlash[2]); 
                    frcp(altCamX + 2, altY + 2, altCamX + 6, altY + 10, 0, 0, 0); 
                }
                if (pRight >= altX && pLeft <= altX + 8 && pBottom <= altY + 12 && ram[22].st >= altY) {
                    ram[36].st = 1; changeGameState(5); 
                    if (typeof playNote === "function") { playNote("E5", 0.06); playNote("E6", 0.40, 0.18); }
                }
            } else { 
                if (altCamX >= -10 && altCamX < 64) { frcp(altCamX, altY, altCamX + 8, altY + 12, 35, 10, 35); }
            }
        }

        let pScreenX = Math.floor(ram[21].st - camX); let pScreenY = Math.floor(ram[22].st);
        if (pScreenX >= -5 && pScreenX < 64) {
            if (ram[39].st === 0 || ram[24].st % 6 < 3) { 
                let suitR = (ram[38].st > 0) ? 255 : 0; let suitG = (ram[38].st > 0) ? 215 : 220;
                frcp(pScreenX, pScreenY, pScreenX + 5, pScreenY + 5, suitR, suitG, 255); 
                if (isMoving && isGrounded && ram[24].st % 8 < 4) {
                    frcp(pScreenX, pScreenY + 5, pScreenX + 1, pScreenY + 5, 40, 40, 40);
                    frcp(pScreenX + 4, pScreenY + 5, pScreenX + 5, pScreenY + 5, 40, 40, 40);
                } else {
                    frcp(pScreenX + 1, pScreenY + 5, pScreenX + 4, pScreenY + 5, 20, 20, 20);
                }
                let eyeX = (playerFacing === 1) ? pScreenX + 3 : pScreenX + 1;
                frcp(eyeX, pScreenY + 1, eyeX + 1, pScreenY + 2, 255, 255, 255); 
            }
        }

        frcp(0, 0, 63, 6, 12, 12, 18);
        drawText("LV" + (currentLvl === 5 ? "S" : currentLvl), 2, 1, 255, 255, 255);
        drawText("*" + ram[33].st, 44, 1, 0, 255, 200); 
    }

    // STATE 3: GAME OVER PANEL
    else if (ram[20].st === 3) {
        frcp(0, 0, 63, 63, 45, 12, 12); 
        drawText("GAME", 24, 20, 255, 60, 60); drawText("OVER", 24, 28, 255, 60, 60);
        if (ram[24].st % 20 < 10) { drawText("START TO RETRY", 4, 46, 255, 255, 255); }
        if (ram[6].st === true && ram[26].st === 0) {
            ram[26].st = 1; ram[21].st = 10; ram[22].st = 30; ram[23].st = 0; ram[25].st = 0; ram[32].st = 0;
            initLevelAssets(ram[29].st); changeGameState(2);
            if (typeof playNote === "function") { playNote("E5", 0.05); }
        }
    }

    // STATE 4: STAGE CLEAR
    else if (ram[20].st === 4) {
        frcp(0, 0, 63, 63, 10, 45, 25); 
        drawText("STAGE", 22, 16, 255, 255, 40); drawText("CLEAR", 22, 24, 255, 255, 40);
        drawText("WELL PLAYED", 10, 36, 255, 255, 255);
        if (ram[24].st % 20 < 10) { drawText("START MAP", 15, 52, 200, 255, 255); }
        if (ram[6].st === true && ram[26].st === 0) { 
            ram[46].st = 1; // UNLOCK NEXT TIER OF LEVELS!
            ram[26].st = 1; changeGameState(1); 
            if (typeof playNote === "function") playNote("C5", 0.08);
        }
    }

    // STATE 5: SECRET FOUND
    else if (ram[20].st === 5) {
        frcp(0, 0, 63, 63, 40, 10, 40); 
        drawText("SECRET", 20, 16, 255, 50, 255); drawText("FOUND", 22, 24, 255, 50, 255);
        drawText("UNLOCKED", 16, 38, 255, 255, 255); drawText("S-LEVEL", 18, 46, 0, 255, 200);
        if (ram[24].st % 20 < 10) { drawText("START MAP", 15, 56, 200, 255, 255); }
        if (ram[6].st === true && ram[26].st === 0) { 
            ram[26].st = 1; changeGameState(1); 
            if (typeof playNote === "function") playNote("E5", 0.08);
        }
    }

    // DYNAMIC WIPE TRANSITION
    if (stateTransitionTimer > 0) {
        if (stateTransitionTimer < 8) {
            let lineSize = stateTransitionTimer * 8; frcp(0, 0, 63, lineSize - 1, 0, 0, 0); stateTransitionTimer++;
        } else if (stateTransitionTimer === 8) {
            ram[20].st = targetState; frcp(0, 0, 63, 63, 0, 0, 0); stateTransitionTimer++;
        } else if (stateTransitionTimer > 8 && stateTransitionTimer < 16) {
            let wipeOffset = (stateTransitionTimer - 8) * 8; frcp(0, wipeOffset, 63, 63, 0, 0, 0); stateTransitionTimer++;
        } else { stateTransitionTimer = 0; }
    }

}, 30);