// --- DASH RUNNER ---
// An intense, high-difficulty auto-runner!
// Press 'A' to jump over the blocks. Press 'START' to restart if you crash.

// 1. Resize Screen
// The standard 11x12 is too narrow for a runner, so we wipe the vram 
// and generate a nice, wide 32x16 screen.
cram();
play = true;
vram.length = 0; 
for (let y = 0; y < 16; y++) {
    let row = [];
    for (let x = 0; x < 32; x++) {
        row.push([0, 0, 0]); 
    }
    vram.push(row);
}

// 2. Initialize RAM Variables
ram[12].st = 14; // Player Y Position (Floor is at 15)
ram[13].st = 0;  // Player Y Velocity (For gravity/jumping)
ram[14].st = 31; // Obstacle X Position
ram[15].st = 0;  // Game State (0 = Playing, 1 = Game Over)
ram[16].st = 2;  // Obstacle Speed

// 3. Game Loop
	
currentGameLoop = setInterval(function () {
    if (ram[15].st === 0) {
        
        // --- PHYSICS & INPUT ---
        // If the player is on the ground (Y:14) and 'A' (ram[0]) is pressed, jump!
        if (ram[12].st >= 14 && ram[0].st === true) {
            ram[13].st = -3; // Apply upward velocity
        }
        
        // Move player Y based on velocity
        ram[12].st += ram[13].st;
        
        // Gravity Logic
        if (ram[12].st < 14) {
            ram[13].st += 1; // Gravity pulls you down 1 pixel per frame
        } else {
            ram[12].st = 14; // Snap to the ground
            ram[13].st = 0;  // Stop falling
        }

        // --- OBSTACLE LOGIC ---
        // Move the obstacle to the left
        ram[14].st -= ram[16].st; 
        
        // If the obstacle goes off-screen, respawn it on the right
        if (ram[14].st < -2) {
            ram[14].st = 31;
            // Randomize speed between 2 and 3 pixels per frame to keep it difficult
            ram[16].st = Math.floor(Math.random() * 2) + 2; 
        }

        // --- COLLISION DETECTION ---
        // Player hitbox is X: 4 to 5. Obstacle hitbox is X: ram[14] to ram[14]+2
        let hitX = (ram[14].st <= 5 && ram[14].st + 2 >= 4);
        
        // Player is touching the ground area (Y: 13 to 14)
        let hitY = (ram[12].st >= 13); 
        
        if (hitX && hitY) {
            ram[15].st = 1; // Crash!
        }

        // --- RENDER ---
        // 1. Draw Background (Dark Blue)
        frcp(0, 0, 31, 15, 25, 30, 45); 
        
        // 2. Draw Floor (White line)
        frcp(0, 15, 31, 15, 220, 220, 220); 

        // 3. Draw Player (Cyan 2x2 Cube)
        frcp(4, ram[12].st - 1, 5, ram[12].st, 0, 255, 255);

        // 4. Draw Obstacle (Red Block)
        frcp(ram[14].st, 13, ram[14].st + 2, 14, 255, 50, 80);

    } else {
        
        // --- GAME OVER ---
        // Flash screen red
        frcp(0, 0, 31, 15, 180, 0, 0); 
        
        // If 'START' (ram[6]) is pressed, reset variables
        if (ram[6].st === true) {
            ram[12].st = 14;
            ram[13].st = 0;
            ram[14].st = 31;
            ram[15].st = 0;
        }
    }
}, 80); // Set to 80ms for a snappy, fast-paced framerate