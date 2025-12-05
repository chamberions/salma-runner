console.log("BG loaded?", bg.src);
bg.onload = () => console.log("BG success");
bg.onerror = () => console.log("BG NOT FOUND");


const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameOver = false;

// BACKGROUND
const bg = new Image();
bg.src = "assets/bg.jpg";
let bgX = 0;

// PLAYER (SALMA)
const player = {
    x: 80,
    y: 170,
    width: 80,
    height: 80,
    vy: 0,
    gravity: 0.8,
    onGround: true,
    sprite: new Image(),
    mode: "run",
    energy: 100,
    maxEnergy: 100
};

const spriteRun = new Image();
spriteRun.src = "assets/salma_run.jpeg";

const spriteSprint = new Image();
spriteSprint.src = "assets/salma_sprint.jpeg";

const spriteJump = new Image();
spriteJump.src = "assets/salma_jump.jpeg";

const cryOverlay = new Image();
cryOverlay.src = "assets/salma_nangis.jpeg";

// OBSTACLES
const obstacleImages = [
    "assets/obs1.png",
    "assets/obs2.png",
    "assets/obs3.jpg",
    "assets/obs4.jpg"
].map(src => {
    let img = new Image();
    img.src = src;
    return img;
});

let obstacles = [];
let obstacleTimer = 0;
let obstacleMinGap = 160;

// FARHANT (BURUNG)
const farhantSprite = new Image();
farhantSprite.src = "assets/farhant.jpeg";

const farhants = [];
let farhantTimer = 0;
let farhantSpawnRate = 260;

// INPUT
let sprintHeld = false;

// SCORE
let score = 0;

// =========================================================
// SPAWN OBSTACLE
function spawnObstacle() {
    const img = obstacleImages[Math.floor(Math.random()*obstacleImages.length)];

    obstacles.push({
        x: canvas.width + 20,
        y: 180,
        width: 60,
        height: 60,
        img: img,
        label: "Masalah Hidup " + (Math.floor(Math.random()*10)+1)
    });
}

// SPAWN FARHANT
function spawnFarhant() {
    farhants.push({
        x: canvas.width + 60,
        y: 130,
        width: 60,
        height: 60,
        speed: 4,
        knockback: 0,
        isHit: false
    });
}

// =========================================================
// UPDATE FARHANT
function updateFarhants() {
    for (let f of farhants) {
        if (!f.isHit) {
            f.x -= f.speed;
        } else {
            f.x += f.knockback;
            f.knockback *= 0.92;
            if (f.knockback < 0.25) f.isHit = false;
        }
    }
}

// FARHANT COLLISION
function checkFarhantCollision() {
    for (let f of farhants) {
        if (
            player.x < f.x + f.width &&
            player.x + player.width > f.x &&
            player.y < f.y + f.height &&
            player.y + player.height > f.y
        ) {
            f.isHit = true;
            f.knockback = 12;
        }
    }
}

// DRAW FARHANT
function drawFarhants() {
    for (let f of farhants) {
        ctx.drawImage(farhantSprite, f.x, f.y, f.width, f.height);
    }
}

// =========================================================
// UPDATE PLAYER
function updatePlayer() {
    player.vy += player.gravity;
    player.y += player.vy;

    if (player.y >= 170) {
        player.y = 170;
        player.vy = 0;
        player.onGround = true;
    }

    // mode
    if (player.mode === "sprint") {
        player.sprite = spriteSprint;
        player.energy -= 0.55;
        if (player.energy < 0) player.energy = 0;
    } else {
        player.sprite = spriteRun;
        player.energy += 0.18;
        if (player.energy > player.maxEnergy) player.energy = player.maxEnergy;
    }
}

// PLAYER JUMP
function jump() {
    if (player.onGround && !gameOver) {
        player.vy = -13;
        player.onGround = false;
        player.sprite = spriteJump;
    }
}

// =========================================================
// UPDATE OBSTACLES
function updateObstacles(speed) {
    for (let o of obstacles) {
        o.x -= speed;
    }
}

// COLLISION WITH OBSTACLE
function checkObstacleCollision() {
    for (let o of obstacles) {
        if (
            player.x < o.x + o.width &&
            player.x + player.width > o.x &&
            player.y < o.y + o.height &&
            player.y + player.height > o.y
        ) {
            gameOver = true;
            document.getElementById("restartScreen").style.visibility = "visible";
        }
    }
}

// DRAW OBSTACLE
function drawObstacles() {
    ctx.font = "18px Fredoka One";
    ctx.fillStyle = "#000";

    for (let o of obstacles) {
        ctx.drawImage(o.img, o.x, o.y, o.width, o.height);
        ctx.fillText(o.label, o.x, o.y + 75);
    }
}

// =========================================================
// MAIN LOOP
function gameLoop() {
    if (!gameOver) requestAnimationFrame(gameLoop);

    // SPEED
    let speed = sprintHeld ? 7 : 4.2;

    // BACKGROUND
    bgX -= speed * 0.5;
    if (bgX <= -canvas.width) bgX = 0;

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(bg, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, bgX + canvas.width, 0, canvas.width, canvas.height);

    // PLAYER UPDATE
    updatePlayer();
    ctx.drawImage(player.sprite, player.x, player.y, player.width, player.height);

    // CRY OVERLAY
    if (player.mode === "sprint") {
        ctx.drawImage(cryOverlay, player.x, player.y - 5, player.width, player.height);
    }

    // OBSTACLE SYSTEM
    obstacleTimer++;
    if (obstacleTimer > obstacleMinGap + Math.random()*80) {
        spawnObstacle();
        obstacleTimer = 0;
    }

    updateObstacles(speed);
    drawObstacles();
    checkObstacleCollision();

    // FARHANT SYSTEM
    farhantTimer++;
    if (farhantTimer > farhantSpawnRate + Math.random()*100) {
        spawnFarhant();
        farhantTimer = 0;
    }

    updateFarhants();
    drawFarhants();
    checkFarhantCollision();

    // SCORE
    score += sprintHeld ? 0.35 : 0.2;
    ctx.fillStyle = "#000";
    ctx.font = "22px Fredoka One";
    ctx.fillText("Score: " + Math.floor(score), 20, 30);

    // ENERGY BAR
    ctx.fillStyle = "#000";
    ctx.font = "17px Fredoka One";
    ctx.fillText("Energi", 20, 55);
    ctx.fillStyle = "#ddd";
    ctx.fillRect(20,65,120,12);
    ctx.fillStyle = "#ff7c9d";
    ctx.fillRect(20,65,(player.energy/player.maxEnergy)*120,12);
}

// =========================================================
// INPUT HANDLING
canvas.addEventListener("click", jump);

const sprintBtn = document.getElementById("sprintBtn");

sprintBtn.addEventListener("touchstart", () => {
    if (player.energy > 1) player.mode = "sprint";
    sprintHeld = true;
});

sprintBtn.addEventListener("touchend", () => {
    player.mode = "run";
    sprintHeld = false;
});

// Restart
document.getElementById("restartText").onclick = () => {
    location.reload();
};

// START
gameLoop();
