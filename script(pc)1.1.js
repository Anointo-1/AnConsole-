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

// Pointer Inputs (Mapped to v1.1 array logic)
aBut.addEventListener("pointerdown", function () {ram[1].st = true});
aBut.addEventListener("pointerup", function () {ram[1].st = false});
bBut.addEventListener("pointerdown", function () {ram[2].st = true});
bBut.addEventListener("pointerup", function () {ram[2].st = false});
upBut.addEventListener("pointerdown", function () {ram[3].st = true});
upBut.addEventListener("pointerup", function () {ram[3].st = false});
downBut.addEventListener("pointerdown", function () {ram[4].st = true});
downBut.addEventListener("pointerup", function () {ram[4].st = false});
leftBut.addEventListener("pointerdown", function () {ram[5].st = true});
leftBut.addEventListener("pointerup", function () {ram[5].st = false});
rightBut.addEventListener("pointerdown", function () {ram[6].st = true});
rightBut.addEventListener("pointerup", function () {ram[6].st = false});
staBut.addEventListener("pointerdown", function () {ram[7].st = true});
staBut.addEventListener("pointerup", function () {ram[7].st = false});
selBut.addEventListener("pointerdown", function () {ram[8].st = true});
selBut.addEventListener("pointerup", function () {ram[8].st = false});

// Second Player Pointer Inputs
aBut2.addEventListener("pointerdown", function () {ram[9].st = true});
aBut2.addEventListener("pointerup", function () {ram[9].st = false});
bBut2.addEventListener("pointerdown", function () {ram[10].st = true});
bBut2.addEventListener("pointerup", function () {ram[10].st = false});
upBut2.addEventListener("pointerdown", function () {ram[11].st = true});
upBut2.addEventListener("pointerup", function () {ram[11].st = false});
downBut2.addEventListener("pointerdown", function () {ram[12].st = true});
downBut2.addEventListener("pointerup", function () {ram[12].st = false});
leftBut2.addEventListener("pointerdown", function () {ram[13].st = true});
leftBut2.addEventListener("pointerup", function () {ram[13].st = false});
rightBut2.addEventListener("pointerdown", function () {ram[14].st = true});
rightBut2.addEventListener("pointerup", function () {ram[14].st = false});
staBut2.addEventListener("pointerdown", function () {ram[15].st = true});
staBut2.addEventListener("pointerup", function () {ram[15].st = false});
selBut2.addEventListener("pointerdown", function () {ram[16].st = true});
selBut2.addEventListener("pointerup", function () {ram[16].st = false});

// ==========================================
// PC KEYBOARD INPUTS (v1.1 Indices)
// ==========================================
const keyMap = {
    // Player 1
    'KeyZ': 1,        // A
    'KeyX': 2,        // B
    'ArrowUp': 3,     // Up
    'KeyW': 3,        // Up
    'ArrowDown': 4,   // Down
    'KeyS': 4,        // Down
    'ArrowLeft': 5,   // Left
    'KeyA': 5,        // Left
    'ArrowRight': 6,  // Right
    'KeyD': 6,        // Right
    'Enter': 7,       // Start
    'ShiftRight': 8,  // Select
    'ShiftLeft': 8,   // Select
    
    // Player 2
    'KeyO': 9,        // A2
    'KeyP': 10,       // B2
    'KeyI': 11,       // Up2
    'KeyK': 12,       // Down2
    'KeyJ': 13,       // Left2
    'KeyL': 14,       // Right2
    'Digit1': 15,     // Start2
    'Digit2': 16      // Select2
};

window.addEventListener('keydown', function(e) {
    if (keyMap[e.code] !== undefined) {
        ram[keyMap[e.code]].st = true;
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

// RAM Configuration v1.1
const ram = [
{st: Math.floor(Math.random() * 255)}, // Console Number
//player 1 controls (1-8)
{st: false}, {st: false}, {st: false}, {st: false},
{st: false}, {st: false}, {st: false}, {st: false},
//player 2 controls (9-16)
{st: false}, {st: false}, {st: false}, {st: false},
{st: false}, {st: false}, {st: false}, {st: false},
//player 1 in (17)
{st: true},
//player 2 in (18)
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

// ROM Configuration v1.1
const rom = [
["storage",
    ["programs",
        [{fname: "app", ftype: "program", file: ["r", "c", "p", ":", "1", "0", "," , "1", "0", ",", "1", "0", ",", "1", "0", ",", "2", "5", "5", ",", "2", "5", "5", ",", "2", "5", "5", ";"]}]
    ],
    ["images",
        [{fname: "picture", ftype: "png", file: [
            [[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]],
            [[255, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [255, 255, 255]],
            [[255, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [255, 255, 255]],
            [[255, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [255, 255, 255]],
            [[255, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [255, 255, 255]],
            [[255, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [0, 255, 255], [255, 255, 255]],
            [[255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255]]
        ]}]
    ]
]
]

//==============
//screen functions:
//==============
function cp(x, y, r, g, b) { vram[y].splice( x, 1); vram[y].splice( x, 0, [r, g, b]); }
function fcp(x, y, r, g, b) { vram[y][x] = [r, g, b]; }

function rcp(x, y, rx, ry, r, g, b) {
    for (let y1 = 0; y1 < vram.length; y1++) {
        for (let x1 = 0; x1 < vram[0].length; x1++) {
            if (((x1 >= x) && (y1 >= y)) && ((x1 <= rx) && (y1 <= ry))) {
                vram[y1].splice( x1, 1); vram[y1].splice( x1, 0, [r, g, b]);
            }
        }
    }
}
function frcp(x, y, rx, ry, r, g, b) {
    for (let y1 = 0; y1 < vram.length; y1++) {
        for (let x1 = 0; x1 < vram[0].length; x1++) {
            if (((x1 >= x) && (y1 >= y)) && ((x1 <= rx) && (y1 <= ry))) { vram[y1][x1] = [r, g, b]; }
        }
    }
}

function cpp(x, y, x2, y2) { let uvar = vram[y][x]; vram[y2].splice( x2, 1); vram[y2].splice( x2, 0, uvar); }
function fcpp(x, y, x2, y2) { let uvar = vram[y][x]; vram[y][x] = uvar; }

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
            }
        }
    }
}

function dp(x, y) { vram[y].splice( x, 0, 0); }

function rdp(x, y, rx, ry) {
    for (let y1 = 0; y1 < vram.length; y1++) {
        for (let x1 = 0; x1 < vram[0].length; x1++) {
            if (((x1 >= x) && (y1 >= y)) && ((x1 <= rx) && (y1 <= ry))) { vram[y1].splice( x1, 0, 0); }
        }
    }
}
function fdp(x, y) { vram[y].splice( x, 1); vram[y].splice( x, 0, 0); }

function frdp(x, y, rx, ry) {
    for (let y1 = 0; y1 < vram.length; y1++) {
        for (let x1 = 0; x1 < vram[0].length; x1++) {
            if (((x1 >= x) && (y1 >= y)) && ((x1 <= rx) && (y1 <= ry))) {
                vram[y1].splice( x1, 1); vram[y1].splice( x1, 0, 0);
            }
        }
    }
}
function csp() {
    for (let y1 = 0; y1 < vram.length; y1++) {
        for (let x1 = 0; x1 < vram[0].length; x1++) {
            if (((x1 >= 0) && (y1 >= 0)) && ((x1 <= vram[0].length) && (y1 <= vram.length))) {
                vram[y1].splice( x1, 1); vram[y1].splice( x1, 0, 0);
            }
        }
    }
}
function fcc(x, y, rd, th, r, g, b) {
    let cx = 0; let cy = 0;
    for (let i = 0; i < th; i++) {
        cx = Math.floor(x + (rd * Math.cos(i)));
        cy = Math.floor(y + (rd * Math.sin(i)));
        fcp(cx, cy, r, g, b);
    }
}

//=====
//run code:
//=====
function runCode(code) {
let uvarx = " "; let uvary = " "; let uvarr = " "; let uvarg = " "; let uvarb = " ";
for (let n = 0; n < code.length; n++) {
    if (code[n] === "c") { n++;
        if (code[n] === "p") { n++;
            if (code[n] === ":") { n++;
                while (code[n] !== ",") { uvarx += code[n]; n++; } n++;
                while (code[n] !== ",") { uvary += code[n]; n++; } n++;
                while (code[n] !== ",") { uvarr += code[n]; n++; } n++;
                while (code[n] !== ",") { uvarg += code[n]; n++; } n++;
                while (code[n] !== ";") { uvarb += code[n]; n++; }
                cp(Number(uvarx), Number(uvary), Number(uvarr), Number(uvarg), Number(uvarb));
                uvarx = " "; uvary = " "; uvarr = " "; uvarg = " "; uvarb = " ";
            }
        }
    }
}
}

//=====
//ram functions:
//=====
function crv(ramVar, newVal) { ram[ramVar].st = newVal; }
function arv(ramVar, val) { ram[ramVar].st += val; }
function mrv(ramVar, val) { ram[ramVar].st = ram[ramVar].st * val; }
function mfrv(ramVar) { ram[ramVar].st = Math.floor(ram[ramVar].st); }
function cram() { for (let i = 0; i < ram.length; i++) { ram[i].st = 0; } }

//=====
//audio:
//=====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playNote(note, duration, timeOffset = 0) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const match = note.match(/^([A-G]#?|b?)([0-9])$/);
  if (!match) return;
  
  let name = match[1];
  const octave = parseInt(match[2], 10);
  if (name.startsWith('b')) {
    const flatMap = { 'Db':'C#', 'Eb':'D#', 'Gb':'F#', 'Ab':'G#', 'Bb':'A#' };
    name = flatMap[name] || name;
  }
  
  const semitones = notes.indexOf(name) + (octave - 4) * 12 - 9;
  const frequency = 440 * Math.pow(2, semitones / 12);

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'triangle';
  osc.frequency.value = frequency;
  
  const startTime = audioCtx.currentTime + timeOffset;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.5, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
}

//=====
//logic & display
//=====
function iF(statement, trueCode, falseCode) {}

let fps = 60;
function render(fps) {
    for (let y = 0; y < vram.length; y++) {
            for (let x = 0; x < vram[y].length; x++) {
            if (vram[y][x] !== 0) {
                c.fillStyle = "rgb(" + vram[y][x][0] + ", " + vram[y][x][1] + ", " + vram[y][x][2] + ")";
                c.fillRect(x * (canvas.width / vram[0].length), y * (canvas.height / vram.length), canvas.width / vram[0].length, canvas.height / vram.length);
            }
            }
    }
    setTimeout(function () { render(fps); }, (1 / fps) * 1000)
}
render(fps);

let fpsv = 0;
setInterval(function () { fpsv++; }, (1 / fps) * 1000)
setInterval(function () {
    document.getElementById("fps") .innerHTML = " ";
    document.getElementById("fps") .innerHTML += fpsv; 
    fpsv = 0;
}, 1000)

while (ram.length < 120) { ram.push({ st: 0 }); }

let playVar = true;
let currentGameLoop = null;

function play() {
  const romName = document.getElementById("romName").value;
  if (!romName) return;
  if (currentGameLoop) { clearInterval(currentGameLoop); currentGameLoop = null; }
  cram(); 
  const oldRom = document.getElementById("rom");
  if (oldRom) oldRom.remove();
  const newRom = document.createElement("script");
  newRom.id = "rom";
  if ((document.getElementById("romName").value === "1") || (document.getElementById("romName").value === "2")) {
  newRom.src = romName + "(1).js";
  } else {
  	newRom.src = romName + ".js";
  }
  document.body.appendChild(newRom);
  console.log("Loading ROM:", newRom.src);
}

// ==========================================
// PC UTILITIES
// ==========================================
function toggleFullScreen() {
    const doc = window.document; const docEl = doc.documentElement;
    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) { requestFullScreen.call(docEl); } 
    else { cancelFullScreen.call(doc); }
}

function aBlur() {
    canvas.width = blurM.value * 10;
    canvas.height = blurM.value * 10;
}

function chBC() {
    document.getElementById("conDis").style.backgroundColor = document.getElementById("boxColor").value;
    document.getElementById("conDis2").style.backgroundColor = document.getElementById("boxColor").value;
    document.getElementById("opDis").style.backgroundColor = document.getElementById("boxColor").value;
}

function chBTCC() {
    document.getElementById("bCase").style.backgroundColor = document.getElementById("butCaseColor").value;
    document.getElementById("bCasep2").style.backgroundColor = document.getElementById("butCaseColor").value;
}

let scsVal = 1;
let scA = false;
let fcsVal = 2;
let fcA = true;

function secConS() {
    scsVal++;
    const btn = document.getElementById("secConSb");
    const p2Panel = document.getElementById("conDisp2");
    if (scsVal % 2 === 0) {
        ram[18].st = true;
        scA = true;
        btn.innerHTML = "ON";
        btn.style.background = "#4a5060";
        p2Panel.style.display = "block"; // Show P2 virtual controls
    } else {
        ram[18].st = false;
        scA = false;
        btn.innerHTML = "OFF";
        btn.style.background = "#333";
        p2Panel.style.display = "none";
    }
}

function firConS() {
    fcsVal++;
    const btn = document.getElementById("firConSb");
    const p1Panel = document.getElementById("bCase");
    if (fcsVal % 2 === 0) {
        ram[17].st = true;
        fcA = true;
        btn.innerHTML = "ON";
        btn.style.background = "#4a5060";
        p1Panel.style.display = "block"; // Show P1 virtual controls
    } else {
        ram[17].st = false;
        fcA = false;
        btn.innerHTML = "OFF";
        btn.style.background = "#333";
        p1Panel.style.display = "none";
    }
}

function addA() {
    canvas.style.aspectRatio = document.getElementById("aspect").value;
}

function addCN() {
    ram[0].st = document.getElementById("consNumIn").value;
}

document.getElementById("consNumIn").value = ram[0].st;