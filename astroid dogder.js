// --- METEOR DODGER ---
// Initializing the RAM variables to start the game
cram();
if (vram.length !== 12) {
    vram.length = 0; 
    for (let y = 0; y < 12; y++) {
        let row = [];
        for (let x = 0; x < 11; x++) { row.push([255, 255, 255]); }
        vram.push(row);
    }
}
ram[8].st = 5;                                // Player starts in the middle (X: 5)
ram[9].st = Math.floor(Math.random() * 11);    // Enemy starts at a random X (0-10)
ram[10].st = 0;                                // Enemy starts at the top (Y: 0)
ram[11].st = 0;                                // Game state: 0 = Alive!

// Assign the runner loop to the global engine variable
currentGameLoop = setInterval(function () {
  
  // IF STATE IS 0: WE ARE PLAYING
  if (ram[11].st === 0) {
    
    // 1. Move Player
    // If LEFT is pressed and we aren't at the left wall (0)
    if (ram[4].st === true && ram[8].st > 0) {
      ram[8].st--;
    }
    // If RIGHT is pressed and we aren't at the right wall (10)
    if (ram[5].st === true && ram[8].st < 10) {
      ram[8].st++;
    }

    // 2. Move Meteor
    ram[10].st++; // Meteor falls 1 pixel down
    
    // If meteor goes off the bottom of the screen
    if (ram[10].st > 11) {
      ram[10].st = 0; // Reset to top
      ram[9].st = Math.floor(Math.random() * 11); // Pick a new random X column
    }

    // 3. Collision Detection
    // If meteor is on the bottom row (11) AND in the same column as the player
    if (ram[10].st === 11 && ram[9].st === ram[8].st) {
      ram[11].st = 1; // Boom! Game Over.
    }

    // 4. Draw the Screen
    frcp(0, 0, 10, 11, 40, 40, 45);              // Clear background (Dark slate grey)
    fcp(ram[9].st, ram[10].st, 255, 50, 50);     // Draw Meteor (Red)
    fcp(ram[8].st, 11, 50, 255, 255);            // Draw Player at Y:11 (Cyan)

  } 
  
  // IF STATE IS 1: GAME OVER
  else {
    // Fill the screen with Red
    frcp(0, 0, 10, 11, 200, 0, 0); 
    
    // If START button is pressed, reset the RAM variables to play again
    if (ram[6].st === true) {
      ram[8].st = 5;
      ram[10].st = 0;
      ram[9].st = Math.floor(Math.random() * 11);
      ram[11].st = 0; 
    }
  }

}, 150); // Set to 150ms so it feels like an arcade game!