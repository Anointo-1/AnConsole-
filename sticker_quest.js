// --- DEVON'S QUEST: THE GOLD STICKER MATRIX ---
// An advanced 64x64 platformer & map system built for your custom engine.
// Controls: 
// - Map Screen: Press LEFT/RIGHT to select a level, press A to enter.
// - In-Game: Press A to Jump. Reach the flashing Gold Sticker on the right!
// - Game Over / Clear Screens: Press START to continue.

// ==========================================
// 1. ENGINE INITIALIZATION & 64x64 VIEWPORT
// ==========================================
vram.length = 0; 
for (let y = 0; y < 64; y++) {
    let row = [];
    for (let x = 0; x < 64; x++) {
        row.push([0, 0, 0]); 
    }
    vram.push(row);
}

// ==========================================
// 2. RAM VARIABLE ALLOCATION MAP
// ==========================================
ram[8].st = 0;   // Global Frame / Time Counter (For Sine Waves)
ram[9].st = 0;   // Engine State (0: Intro/Title, 1: Map Screen, 2: In-Game, 3: Level Clear, 4: Game Over, 5: Ultimate Victory)
ram[10].st = 1;  // Map Selection Cursor (Level 1, 2, or 3)
ram[11].st = 5;  // Player X Position
ram[12].st = 48; // Player Y Position 
ram[13].st = 0;  // Player Y Velocity (Gravity)
ram[14].st = 1;  // Currently Active Level ID (1, 2, or 3)
ram[15].st = 60; // Hazard X Position
ram[16].st = 48; // Hazard Y Position
ram[17].st = 2;  // Hazard Speed Speed Multiplier
ram[18].st = 0;  // Level 1 Cleared Status (0 = Locked/Unbeaten, 1 = Cleared)
ram[19].st = 0;  // Level 2 Cleared Status
ram[20].st = 0;  // Level 3 Cleared Status

// ==========================================
// 3. MAIN GAME ENGINE LOOP
// ==========================================
currentGameLoop = setInterval(function () {
    ram[8].st++; // Tick the engine timer

    // --------------------------------------
    // STATE 0: INTRO / TITLE SCREEN
    // --------------------------------------
    if (ram[9].st === 0) {
        // Render Dark Neon Slate Background
        frcp(0, 0, 63, 63, 15, 15, 25);
        
        // Draw a massive glowing "ME" Approved Sticker outline in the center
        frcp(16, 16, 48, 48, 255, 185, 0);   // Gold Sticker Base
        frcp(19, 19, 45, 45, 30, 30, 50);     // Inner Cutout
        
        // Simple pixel representation of letters "M" and "E" inside the sticker
        frcp(24, 26, 25, 38, 255, 255, 255); // M left
        frcp(29, 26, 30, 38, 255, 255, 255); // M right
        fcp(26, 28, 255, 255, 255); fcp(28, 28, 255, 255, 255); fcp(27, 30, 255, 255, 255); // M middle
        
        frcp(35, 26, 36, 38, 255, 255, 255); // E spine
        frcp(37, 26, 40, 27, 255, 255, 255); // E top
        frcp(37, 32, 39, 33, 255, 255, 255); // E mid
        frcp(37, 37, 40, 38, 255, 255, 255); // E bottom

        // Bottom Banner Pulsing
        let pulse = Math.floor(150 + Math.sin(ram[8].st * 0.2) * 105);
        frcp(10, 54, 54, 56, 0, pulse, pulse); // Prompt line

        // Input: Press START to boot into the Level Map
        if (ram[6].st === true) {
            ram[9].st = 1; // Go to map
        }
    }

    // --------------------------------------
    // STATE 1: OVERWORLD LEVEL MAP
    // --------------------------------------
    else if (ram[9].st === 1) {
        // Background: Cool cybergrid
        frcp(0, 0, 63, 63, 20, 20, 35);
        
        // Draw paths connecting the levels
        frcp(12, 32, 52, 33, 80, 80, 100);
        
        // Draw Level 1 Node (Green if beaten, Red if not)
        let lvl1Color = ram[18].st === 1 ? [0, 255, 100] : [255, 50, 50];
        frcp(10, 28, 16, 36, lvl1Color[0], lvl1Color[1], lvl1Color[2]);
        
        // Draw Level 2 Node
        let lvl2Color = ram[19].st === 1 ? [0, 255, 100] : [255, 50, 50];
        frcp(29, 28, 35, 36, lvl2Color[0], lvl2Color[1], lvl2Color[2]);
        
        // Draw Level 3 Node
        let lvl3Color = ram[20].st === 1 ? [0, 255, 100] : [255, 50, 50];
        frcp(48, 28, 54, 36, lvl3Color[0], lvl3Color[1], lvl3Color[2]);

        // Map Selection Navigation Input
        if (ram[4].st === true && ram[10].st > 1 && ram[8].st % 5 === 0) ram[10].st--; // Left
        if (ram[5].st === true && ram[10].st < 3 && ram[8].st % 5 === 0) ram[10].st++; // Right

        // Draw Player Selector Outline around chosen level node
        let cursorX = ram[10].st === 1 ? 8 : (ram[10].st === 2 ? 27 : 46);
        frcp(cursorX, 26, cursorX+10, 27, 0, 255, 255);
        frcp(cursorX, 37, cursorX+10, 38, 0, 255, 255);
        frcp(cursorX, 26, cursorX+1, 38, 0, 255, 255);
        frcp(cursorX+9, 26, cursorX+10, 38, 0, 255, 255);

        // Enter selected level on pressing Button A
        if (ram[0].st === true) {
            ram[14].st = ram[10].st; // Set level ID
            ram[11].st = 5;          // Reset player X
            ram[12].st = 48;         // Reset player Y
            ram[13].st = 0;          // Reset velocity
            ram[15].st = 60;         // Reset hazard X
            
            // Set difficulty dynamic speeds per level
            ram[17].st = ram[14].st === 1 ? 2 : (ram[14].st === 2 ? 3 : 4);
            ram[9].st = 2; // Move to Gameplay state
        }
    }

    // --------------------------------------
    // STATE 2: CORE GAMEPLAY (THE DIMENSIONS)
    // --------------------------------------
    else if (ram[9].st === 2) {
        
        // --- 1. SINE WAVE BACKGROUND ENGINE ---
        // Clears screen and draws a dynamic flowing sine gradient across the matrix
        frcp(0, 0, 63, 63, 10, 10, 20); // Clear base
        for (let x = 0; x < 64; x += 4) {
            // Compute sine wave trajectory offset dynamically over time
            let waveY = Math.floor(25 + Math.sin((x + ram[8].st * 2) * 0.15) * 8);
            // Color shifts dynamically based on current level theme
            let rWave = ram[14].st === 1 ? 30 : (ram[14].st === 2 ? 120 : 40);
            let gWave = ram[14].st === 2 ? 30 : 60;
            frcp(x, waveY, x + 3, 53, rWave, gWave, 110);
        }

        // Draw solid digital floor layout
        frcp(0, 54, 63, 63, 200, 200, 220);
        frcp(0, 54, 63, 55, 0, 255, 200); // Glowing floor trim

        // --- 2. PLAYER PHYSICS & CONTROLS ---
        // Jump Execution (A Button) - Allowed only when touching down on floor
        if (ram[12].st >= 48 && ram[0].st === true) {
            ram[13].st = -5; // Upward impulse force
        }

        // Apply constant gravity calculations
        ram[12].st += ram[13].st;
        if (ram[12].st < 48) {
            ram[13].st += 1; // Pull downwards
        } else {
            ram[12].st = 48; // Floor lock
            ram[13].st = 0;
        }

        // Horizontal movement layout controls
        if (ram[4].st === true && ram[11].st > 1) ram[11].st -= 2;  // Move Left
        if (ram[5].st === true && ram[11].st < 58) ram[11].st += 2; // Move Right

        // --- 3. LEVEL SPECIFIC HAZARD MECHANICS ---
        ram[15].st -= ram[17].st; // Progress obstacle across coordinates
        if (ram[15].st < -4) {
            ram[15].st = 64; // Loop back around
        }

        // Level 2 & 3 vertical movement modifier mechanics (Desynchronized patterns)
        if (ram[14].st === 2) {
            ram[16].st = Math.floor(46 + Math.sin(ram[8].st * 0.3) * 6); // Floating sine hazard
        } else if (ram[14].st === 3) {
            ram[16].st = (ram[8].st % 20 < 10) ? 48 : 38; // Extreme high/low jumping spikes
        } else {
            ram[16].st = 48; // Level 1: Basic ground hazard
        }

        // --- 4. COLLISION DETECTION ENGINE ---
        // Bounds processing for Player (6x6 sprite) vs Hazard (4x6 sprite)
        let hitX = (ram[15].st <= ram[11].st + 5 && ram[15].st + 4 >= ram[11].st);
        let hitY = (ram[16].st <= ram[12].st + 5 && ram[16].st + 6 >= ram[12].st);
        
        if (hitX && hitY) {
            ram[9].st = 4; // CRASH! Switch engine state to Game Over
        }

        // Goal Post Processing (Check if Devon reaches the right side Matrix wall)
        if (ram[11].st >= 54) {
            // Flag level complete index tracker variables
            if (ram[14].st === 1) ram[18].st = 1;
            if (ram[14].st === 2) ram[19].st = 1;
            if (ram[14].st === 3) ram[20].st = 1;

            // Check final win conditions (Are all 3 dimensional matrices certified?)
            if (ram[18].st === 1 && ram[19].st === 1 && ram[20].st === 1) {
                ram[9].st = 5; // Global campaign clear state trigger!
            } else {
                ram[9].st = 3; // Standard Level Clear state
            }
        }

        // --- 5. DETAILED SPRITE RENDERING GRAPHICS ---
        // Draw Goal Post: Glowing "Me Approved" Sticker Node (Flashes Gold/White)
        let goalFlash = ram[8].st % 4 < 2 ? [255, 215, 0] : [255, 255, 255];
        frcp(55, 42, 60, 53, goalFlash[0], goalFlash[1], goalFlash[2]);
        frcp(56, 43, 59, 52, 50, 50, 50); // inner contrast ring

        // Draw Obstacle/Hazard (High detailed spiked plasma cube)
        let hX = ram[15].st;
        let hY = ram[16].st;
        frcp(hX, hY, hX+4, hY+5, 255, 0, 100);       // Magenta outer frame
        frcp(hX+1, hY+1, hX+3, hY+4, 255, 200, 0);   // Yellow core fire
        fcp(hX+2, hY+2, 255, 255, 255);              // White eye flash

        // Draw Player Sprite: Devon (Detailed 6x6 Cyber-Suit Outfit)
        let pX = ram[11].st;
        let pY = ram[12].st;
        frcp(pX, pY, pX+5, pY+5, 0, 150, 255);       // Cyan helmet and armor body shell
        frcp(pX+1, pY+4, pX+4, pY+5, 0, 80, 180);    // Dark blue thruster boots
        frcp(pX+2, pY+1, pX+4, pY+2, 0, 255, 255);   // Luminous visor plate
        fcp(pX+3, pY+1, 255, 255, 255);              // Visor reflection sparkle
    }

    // --------------------------------------
    // STATE 3: LEVEL CLEAR SCREEN
    // --------------------------------------
    else if (ram[9].st === 3) {
        frcp(0, 0, 63, 63, 0, 40, 20); // Matrix Green Screen tint
        // Giant Checkmark Graphic Vector
        frcp(28, 34, 32, 38, 0, 255, 100);
        frcp(32, 24, 36, 38, 0, 255, 100);
        
        // Wait for START input to return safely back to the World Map selection window
        if (ram[6].st === true) {
            ram[9].st = 1;
        }
    }

    // --------------------------------------
    // STATE 4: GAME OVER SCREEN
    // --------------------------------------
    else if (ram[9].st === 4) {
        frcp(0, 0, 63, 63, 60, 0, 10); // Blood Crimson red fill
        // Draw an 'X' symbol graphic frame across middle quadrant layout
        frcp(24, 24, 28, 40, 255, 255, 255);
        frcp(36, 24, 40, 40, 255, 255, 255);
        frcp(24, 30, 40, 34, 255, 255, 255);

        // Press START engine command input map interface to re-init back to Overworld map 
        if (ram[6].st === true) {
            ram[9].st = 1; 
        }
    }

    // --------------------------------------
    // STATE 5: ULTIMATE VICTORY UNLOCKED
    // --------------------------------------
    else if (ram[9].st === 5) {
        // Psychedelic flashing rave screen effect!
        let rRave = Math.floor(127 + Math.sin(ram[8].st * 0.5) * 127);
        let gRave = Math.floor(127 + Math.sin(ram[8].st * 0.3) * 127);
        let bRave = Math.floor(127 + Math.sin(ram[8].st * 0.2) * 127);
        frcp(0, 0, 63, 63, rRave, gRave, bRave);

        // Render the ultimate prize directly in center: The Verified Gold Sticker!
        frcp(12, 12, 52, 52, 255, 220, 0);   // Deep Gold Sticker Base
        frcp(16, 16, 48, 48, 255, 255, 255); // Inner Diamond Layer Glow
        frcp(20, 20, 44, 44, 0, 0, 0);       // Dark Center Board

        // Mini check icon drawn inside sticker core frame center
        frcp(26, 32, 30, 36, 0, 255, 150);
        frcp(30, 24, 34, 36, 0, 255, 150);
    }

}, 50); // Set engine cycle loop to a hyper-fluid 50ms rate for smooth rendering mechanics!