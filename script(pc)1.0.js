const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
const aBut = document.getElementById("btn-a");
const bBut = document.getElementById("btn-b");
const upBut = document.getElementById("btn-up");
const downBut = document.getElementById("btn-down");
const leftBut = document.getElementById("btn-left");
const rightBut = document.getElementById("btn-right");
const staBut = document.getElementById("btn-start");
const selBut = document.getElementById("btn-select");

const aBut2 = document.getElementById("btn-a2");
const bBut2 = document.getElementById("btn-b2");
const upBut2 = document.getElementById("btn-up2");
const downBut2 = document.getElementById("btn-down2");
const leftBut2 = document.getElementById("btn-left2");
const rightBut2 = document.getElementById("btn-right2");
const staBut2 = document.getElementById("btn-start2");
const selBut2 = document.getElementById("btn-select2");
const blurM = document.getElementById("blur");

// Pointer/Mouse inputs (kept so clicking the on-screen buttons still works)
aBut.addEventListener("pointerdown", function () {ram[0].st = true});
aBut.addEventListener("pointerup", function () {ram[0].st = false});
bBut.addEventListener("pointerdown", function () {ram[1].st = true});
bBut.addEventListener("pointerup", function () {ram[1].st = false});
upBut.addEventListener("pointerdown", function () {ram[2].st = true});
upBut.addEventListener("pointerup", function () {ram[2].st = false});
downBut.addEventListener("pointerdown", function () {ram[3].st = true});
downBut.addEventListener("pointerup", function () {ram[3].st = false});
leftBut.addEventListener("pointerdown", function () {ram[4].st = true});
leftBut.addEventListener("pointerup", function () {ram[4].st = false});
rightBut.addEventListener("pointerdown", function () {ram[5].st = true});
rightBut.addEventListener("pointerup", function () {ram[5].st = false});
staBut.addEventListener("pointerdown", function () {ram[6].st = true});
staBut.addEventListener("pointerup", function () {ram[6].st = false});
selBut.addEventListener("pointerdown", function () {ram[7].st = true});
selBut.addEventListener("pointerup", function () {ram[7].st = false});

// ==========================================
// PC KEYBOARD INPUTS
// ==========================================
const keyMap = {
    'KeyZ': 0,        // A Button
    'KeyX': 1,        // B Button
    'ArrowUp': 2,     // Up
    'KeyW': 2,        // Up
    'ArrowDown': 3,   // Down
    'KeyS': 3,        // Down
    'ArrowLeft': 4,   // Left
    'KeyA': 4,        // Left
    'ArrowRight': 5,  // Right
    'KeyD': 5,        // Right
    'Enter': 6,       // Start
    'ShiftRight': 7,  // Select
    'ShiftLeft': 7    // Select
};

window.addEventListener('keydown', function(e) {
    if (keyMap[e.code] !== undefined) {
        ram[keyMap[e.code]].st = true;
        // Prevent default browser scrolling when using arrow keys or space
        if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
    }
});

window.addEventListener('keyup', function(e) {
    if (keyMap[e.code] !== undefined) {
        ram[keyMap[e.code]].st = false;
    }
});

// RAM Setup
const ram = [
{st: Math.floor(Math.random() * 255)},
//player 1 controls:
{st: false},
{st: false},
{st: false},
{st: false},
{st: false},
{st: false},
{st: false},
{st: false},
//player 1 in:
{st: false},
]

// VRAM Setup
const vram = [
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
[[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
]

const rom = [
    {fname: "app", ftype: "program", file: ["r", "c", "p", ":", "1", "0", "," , "1", "0", ",", "1", "0", ",", "1", "0", ",", "2", "5", "5", ",", "2", "5", "5", ",", "2", "5", "5", ";"]},
    {fname: "picture", ftype: "png", file: [
        [[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
        [[255, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [255, 255, 255]],
        [[255, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [255, 255, 255]],
        [[255, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [255, 255, 255]],
        [[255, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [255, 255, 255]],
        [[255, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [255, 255, 255]],
        [[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]]
    ]}
]

//==============
//screen functions:
//==============
function cp(x, y, r, g, b) {
vram[y].splice( x, 1);
vram[y].splice( x, 0, [r, g, b]);
}
function fcp(x, y, r, g, b) {
vram[y][x] = [r, g, b];
}
//=====
function rcp(x, y, rx, ry, r, g, b) {
for (let y1 = 0; y1 < vram.length; y1++) {
for (let x1 = 0; x1 < vram[0].length; x1++) {
    if (((x1 >= x) && (y1 >= y)) && ((x1 <= rx) && (y1 <= ry))) {
    vram[y1].splice( x1, 1);
    vram[y1].splice( x1, 0, [r, g, b]);
    }
}
}
}
function frcp(x, y, rx, ry, r, g, b) {
for (let y1 = 0; y1 < vram.length; y1++) {
for (let x1 = 0; x1 < vram[0].length; x1++) {
    if (((x1 >= x) && (y1 >= y)) && ((x1 <= rx) && (y1 <= ry))) {
    vram[y1][x1] = [r, g, b];
    }
}
}
}
//=====
//cpp
//=====
function cpp(x, y, x2, y2) {
let uvar = vram[y][x];
vram[y2].splice( x2, 1);
vram[y2].splice( x2, 0, uvar);
}
function fcpp(x, y, x2, y2) {
let uvar = vram[y][x];
vram[y][x] = uvar;
}
//=====
function rcpp(x, y, rx, ry, x2, y2) {
for (let y1 = 0; y1 < vram.length; y1++) {
for (let x1 = 0; x1 < vram[0].length; x1++) {
    if (((x1 >= x) && (y1 >= y)) && ((x1 <= rx) && (y1 <= ry))) {
    let uvar = vram[y + (y1 - y)][x + (x1 - x)];
    vram[y2 + (y1 - y)].splice( x2 + (x1 - x), 1);
    vram[y2 + (y1 - y)].splice( x2 + (x1 - x), 0, uvar);
    }
}
}
}
function frcpp(x, y, rx, ry, x2, y2) {
for (let y1 = 0; y1 < vram.length; y1++) {
for (let x1 = 0; x1 < vram[0].length; x1++) {
    if (((x1 >= x) && (y1 >= y)) && ((x1 <= rx) && (y1 <= ry))) {
    let uvar = vram[y + (y1 - y)][x + (x1 - x)];
    vram[y2 + (y1 - y)][x2 + (x1 - x)] = uvar;
    vram[y2 + (y1 - y)][x2 + (x1 - x)] = uvar;
    }
}
}
}
//=====
//dp
//=====
function dp(x, y) {
vram[y].splice( x, 0, 0);
}
//=====
function rdp(x, y, rx, ry) {
for (let y1 = 0; y1 < vram.length; y1++) {
for (let x1 = 0; x1 < vram[0].length; x1++) {
    if (((x1 >= x) && (y1 >= y)) && ((x1 <= rx) && (y1 <= ry))) {
    vram[y1].splice( x1, 0, 0);
    }
}
}
}
//=====
function fdp(x, y) {
vram[y].splice( x, 1);
vram[y].splice( x, 0, 0);
}
//=====
function frdp(x, y, rx, ry) {
for (let y1 = 0; y1 < vram.length; y1++) {
for (let x1 = 0; x1 < vram[0].length; x1++) {
    if (((x1 >= x) && (y1 >= y)) && ((x1 <= rx) && (y1 <= ry))) {
    vram[y1].splice( x1, 1);
    vram[y1].splice( x1, 0, 0);
    }
}
}
}
//=====
function csp() {
for (let y1 = 0; y1 < vram.length; y1++) {
for (let x1 = 0; x1 < vram[0].length; x1++) {
    if (((x1 >= 0) && (y1 >= 0)) && ((x1 <= vram[0].length) && (y1 <= vram.length))) {
    vram[y1].splice( x1, 1);
    vram[y1].splice( x1, 0, 0);
    }
}
}
}
//=====
function fcc(x, y, rd, th, r, g, b) {
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < th; i++) {
     cx = Math.floor(x + (rd * Math.cos(i)));
    cy = Math.floor(y + (rd * Math.sin(i)));
     fcp(cx, cy, r, g, b);
    }
}
//=====
//run code:
//=====

//=====
function runCode(code) {
let uvarx = " ";
let uvary = " ";
let uvarr = " ";
let uvarg = " ";
let uvarb = " ";
for (let n = 0; n < code.length; n++) {
if (code[n] === "c") {
n++;
if (code[n] === "p") {
n++;
    if (code[n] === ":") {
    n++;
    while (code[n] !== ",") {
    uvarx += code[n];
    n++;
    }
    n++;
    while (code[n] !== ",") {
    uvary += code[n];
    n++;
    }
    n++;
    while (code[n] !== ",") {
    uvarr += code[n];
    n++;
    }
    n++;
    while (code[n] !== ",") {
    uvarg += code[n];
    n++;
    }
    n++;
    while (code[n] !== ";") {
    uvarb += code[n];
    n++;
    }
    cp(Number(uvarx), Number(uvary), Number(uvarr), Number(uvarg), Number(uvarb));
    uvarx = " ";
    uvary = " ";
    uvarr = " ";
    uvarg = " ";
    uvarb = " ";
    }
}
}
}
}
//=====
//ram functions:
//=====
//crv
//=====
function crv(ramVar, newVal) {
ram[ramVar].st = newVal;
}
//=====
function arv(ramVar, val) {
ram[ramVar].st += val;
}
//=====
function mrv(ramVar, val) {
ram[ramVar].st = ram[ramVar].st * val;
}
function mfrv(ramVar) {
ram[ramVar].st = Math.floor(ram[ramVar].st);
}
function cram() {
for (let i = 0; i < ram.length; i++) {
ram[i].st = 0;
}
}
//=====
//audio:
//=====
// Initialize the audio environment once
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/**
* Plays a single note with the absolute minimum required parameters.
* @param {string} note - The musical note and octave (e.g., "C4", "Eb5", "A3")
* @param {number} duration - How long the note lasts in seconds (e.g., 0.5)
* @param {number} timeOffset - When to play the note relative to "now" (e.g., 0)
*/
function playNote(note, duration, timeOffset = 0) {
// 1. Calculate frequency from note name (A4 = 440Hz base)
const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const match = note.match(/^([A-G]#?|b?)([0-9])$/);
if (!match) return;

let name = match[1];
const octave = parseInt(match[2], 10);

// Convert flats to sharps for calculation simplicity
if (name.startsWith('b')) {
const flatMap = { 'Db':'C#', 'Eb':'D#', 'Gb':'F#', 'Ab':'G#', 'Bb':'A#' };
name = flatMap[name] || name;
}

const semitones = notes.indexOf(name) + (octave - 4) * 12 - 9;
const frequency = 440 * Math.pow(2, semitones / 12);

// 2. Create audio nodes
const osc = audioCtx.createOscillator();
const gain = audioCtx.createGain();

osc.connect(gain);
gain.connect(audioCtx.destination);

// 3. Set minimum attributes
osc.type = 'triangle'; // 'triangle' sounds softer and more musical than 'sine'
osc.frequency.value = frequency;

const startTime = audioCtx.currentTime + timeOffset;

// 4. Volume envelope to prevent annoying speaker clicks
gain.gain.setValueAtTime(0, startTime);
gain.gain.linearRampToValueAtTime(0.5, startTime + 0.02); // Quick fade in
gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Fade out

// 5. Playback schedule
osc.start(startTime);
osc.stop(startTime + duration);
}

//=====
//logic:
//=====
function iF(statement, trueCode, falseCode) {
if (statement) {

} else {

}
}

//display:
let fps = 60;
function render(fps) {
    for (let y = 0; y < vram.length; y++) {
            for (let x = 0; x < vram[y].length; x++) {
            if (vram[y][x] !== 0) {
                c.fillStyle = "rgb(" + vram[y][x][0] + ", " + vram[y][x][1] + ", " + vram[y][x][2] + ")";
                c.fillRect(x * (canvas.width / vram[0].length), y * (canvas.height / vram.length), canvas.width / vram[0].length, canvas.height / vram.length);
            } else {}
            }
    }
    setTimeout(function () {
    render(fps);
    console.log(": fps");
    }, (1 / fps) * 1000)
}

render(fps);

//fps:
let fpsv = 0;
setInterval(function () {
fpsv++;
}, (1 / fps) * 1000)
setInterval(function () {
document.getElementById("fps") .innerHTML = " ";
document.getElementById("fps") .innerHTML += "fps: " + fpsv; 
fpsv = 0;
}, 1000)

//ram increase:
while (ram.length < 120) {
ram.push({ st: 0 });
}

let playVar = true;
//play new game:
let currentGameLoop = null;

function play() {
const romName = document.getElementById("romName").value;
if (!romName) return;

// 1. CLEAR THE RUNNING GAME LOOP TO PREVENT GLITCHING
if (currentGameLoop) {
clearInterval(currentGameLoop);
currentGameLoop = null;
}

// 2. Clear out the RAM so variables from the last game don't carry over
cram(); 

// 3. Remove the old script tag if it exists
const oldRom = document.getElementById("rom");
if (oldRom) oldRom.remove();

// 4. Create and load the fresh script tag
const newRom = document.createElement("script");
newRom.id = "rom";
newRom.src = romName + ".js";

document.body.appendChild(newRom);
console.log("Loading ROM:", newRom.src);
}

// ==========================================
// PC UI / UTILITY OPTIONS
// ==========================================

function toggleFullScreen() {
    const doc = window.document;
    const docEl = doc.documentElement;

    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        requestFullScreen.call(docEl);
    } else {
        cancelFullScreen.call(doc);
    }
}

function aBlur() {
canvas.width = blurM.value * 10;
canvas.height = blurM.value * 10;
}

function option() {
    document.getElementById("conDis") .style.display = "none";
    document.getElementById("conDis2") .style.display = "none";
    document.getElementById("conDisp2") .style.display = "none";
    document.getElementById("bCase") .style.display = "none";
    document.getElementById("opDis") .style.display = "block";
}

function back() {
    document.getElementById("conDis") .style.display = "block";
    document.getElementById("conDis2") .style.display = "block";
    if (scA) {
        document.getElementById("conDisp2") .style.display = "block";
    }
    if (fcA) {
        document.getElementById("bCase") .style.display = "flex";
    }
    document.getElementById("opDis") .style.display = "none";
}

function chBC() {
    document.getElementById("conDis") .style.backgroundColor = document.getElementById("boxColor") .value;
    document.getElementById("conDis2") .style.backgroundColor = document.getElementById("boxColor") .value;
    document.getElementById("conDisp2") .style.backgroundColor = document.getElementById("boxColor") .value;
}

function chBTCC() {
    document.getElementById("bCase") .style.backgroundColor = document.getElementById("butCaseColor") .value;
    document.getElementById("bCasep2") .style.backgroundColor = document.getElementById("butCaseColor") .value;
}

function secConS() {
    scsVal++;
    if (scsVal % 2 === 0) {
     scA = true;
     document.getElementById("secConSb") .innerHTML = "on";
    } else if (scsVal % 2 === 1) {
     scA = false;
     document.getElementById("secConSb") .innerHTML = "off";
    }
}

function firConS() {
    fcsVal++;
    if (fcsVal % 2 === 0) {
     fcA = true;
     document.getElementById("firConSb") .innerHTML = "on";
    } else if (scsVal % 2 === 1) {
     fcA = false;
     document.getElementById("firConSb") .innerHTML = "off";
    }
}

function addA() {
    canvas.style.aspectRatio = document.getElementById("aspect") .value;
}

document.getElementById("opDis") .style.display = "none";
document.getElementById("conDisp2") .style.display = "none";
let scsVal = 1;
let scA = false;
let fcsVal = 2;
let fcA = true;