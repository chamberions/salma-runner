const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameOver = false;

// BACKGROUND
const bg = new Image();
bg.src = "assets/bg.jpg";
let bgX = 0;

// DUMMY ANIMASI
const girlRun = new Image();
girlRun.src = "assets/girl_run.png";

const girlSprint = new Image();
girlSprint.src = "assets/girl_sprint.png";

const girlJump = new Image();
girlJump.src = "assets/girl_jump.png";

const cryFX = new Image();
cryFX.src = "assets/effect_cry.png";

const loveFX = new Image();
loveFX.src = "assets/love.png";

const bird = new Image();
bird.src = "assets/farhant.png";

// PLAYER
const player = {
    x: 80,
    y: 180,
    width: 70,
    height: 70,
    vy: 0,
    gravity: 0.8,
    onGround: true,
    sprite: girlRun,
    energy: 100,
    maxEnergy: 100,
    speed: 6,
    baseSpeed: 6
};

// SCORE
let score = 0;

// INPUT
let sprintHeld = false;

// OBSTACLES
const obstacleImages = [
    "assets/obs1.png",
    "assets/obs2.png",
    "assets/obs3.png"
].map(src => {
    let img = new Image();
    img.src = src;
    return img;
});

let obstacles = [];
let obstacleTimer = 0;
let obstacleMinGap = 200;

// FARHANT
let farhants = [];
let farhantTimer = 0;

// SPAWN OBSTACLE
function spawnObstacle() {
    const img = obstacleImages[Math.floor(Math.random()*obstacleImages.length)];
    obstacles.push({
        x: canvas.width + 50,
        y: 190,
        width: 60,
        height: 60,
        img: img,
        label: "Masalah Hidup"
    });
}

// SPAWN FARHANT
function spawnFarhant() {
    farhants.push({
        x: canvas.width + 60,
        y: 130,
        width: 55,
        height: 55,
        dx: 4,
        knock: 0,
        hit: false
    });
}

// UPDATE PLAYER
function updatePlayer() {

    // Apply jump physics
    player.vy += player.gravity;
    player.y += player.vy;

    if (player.y >= 180) {
        player.y = 180;
        player.onGround = true;
        player.vy = 0;
    }

    // SPRINT
    if (sprintHeld && player.energy > 0) {
        player.speed = 10;
        player.energy -= 0.8;
        player.sprite = girlSprint;
    } else {
        player.speed = 6;
        player.sprite = girlRun;
        player.energy += 0.5;
    }

    if (player.energy < 0) player.energy = 0;
    if (player.energy > player.maxEnergy) player.energy = player.maxEnergy;

}

// DRAW PLAYER
function drawPlayer() {
    ctx.drawImage(player.sprite, player.x, player.y, player.width, player.height);

    if (player.sprite === girlSprint) {
        ctx.drawImage(cryFX, player.x - 10, player.y - 10, 40, 40);
    }
}

// LOVE FX
let loveFrames = [];
function drawLove() {
    for (let f of loveFrames) {
        ctx.drawImage(loveFX, f.x, f.y, 30, 30);
        f.y -= 2;
        f.life--;
    }
    loveFrames = loveFrames.filter(f => f.life > 0);
}

// FARHANT UPDATE
function updateFarhants() {
    for (let f of farhants) {
        if (!f.hit) {
            f.x -= f.dx;
        } else {
            f.x += f.knock;
            f.knock *= 0.92;
            if (f.knock < 0.3) f.hit = false;
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
            f.hit = true;
            f.knock = 12;
        }
    }
}

// DRAW FARHANT
function drawFarhants() {
    for (let f of farhants) {
        ctx.drawImage(bird, f.x, f.y, f.width, f.height);
    }
}

// COLLISION OBSTACLE
function checkCollision() {
    for (let o of obstacles) {
        if (
            player.x < o.x + o.width &&
            player.x + player.width > o.x &&
            player.y < o.y + o.height &&
            player.y + player.height > o.y
        ) {
            gameOver = true;
            document.getElementById("restartScreen").style.display = "flex";
        }
    }
}

// GAME LOOP
function gameLoop() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // BG
    bgX -= player.speed * 0.4;
    if (bgX <= -canvas.width) bgX = 0;
    ctx.drawImage(bg, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, bgX + canvas.width, 0, canvas.width, canvas.height);

    updatePlayer();
    drawPlayer();
    drawLove();

    // OBSTACLES
    obstacleTimer++;
    if (obstacleTimer > obstacleMinGap + Math.random() * 200) {
        spawnObstacle();
        obstacleTimer = 0;
    }

    for (let o of obstacles) {
        o.x -= player.speed;
        ctx.drawImage(o.img, o.x, o.y, o.width, o.height);
    }

    checkCollision();

    // FARHANT
    farhantTimer++;
    if (farhantTimer > 250) {
        spawnFarhant();
        farhantTimer = 0;
    }

    updateFarhants();
    drawFarhants();
    checkFarhantCollision();

    // Score
    score += 0.2;
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + Math.floor(score), 20, 30);
