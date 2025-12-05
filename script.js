const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameOver = false;
let score = 0;

// PLAYER
const player = {
    x: 80,
    y: 190,
    width: 60,
    height: 60,
    vy: 0,
    gravity: 0.8,
    onGround: true,
    sprint: false,
    energy: 100,
    maxEnergy: 100,
    speed: 6,
    baseSpeed: 6
};

// OBSTACLES
let obstacles = [];
let obstacleTimer = 0;
let obstacleGap = 200;

// FARHANT
let farhants = [];
let farhantTimer = 0;

// LOVE EFFECT
let loveFX = [];

// SPRINT BUTTON INPUT
let sprintHeld = false;

document.getElementById("sprintBtn").addEventListener("touchstart", () => sprintHeld = true);
document.getElementById("sprintBtn").addEventListener("touchend", () => sprintHeld = false);
document.getElementById("sprintBtn").addEventListener("mousedown", () => sprintHeld = true);
document.getElementById("sprintBtn").addEventListener("mouseup", () => sprintHeld = false);

// TAP TO JUMP
canvas.addEventListener("touchstart", jump);
canvas.addEventListener("mousedown", jump);

document.getElementById("restartText").onclick = () => location.reload();

// ===========================================================
// DRAW PLAYER (CARTOON)
// ===========================================================
function drawPlayer() {
    ctx.save();

    // Body
    ctx.fillStyle = "#ffccdd";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Head
    ctx.beginPath();
    ctx.arc(player.x + 30, player.y - 10, 18, 0, Math.PI * 2);
    ctx.fillStyle = player.sprint ? "#ff88aa" : "#ffb3c6";
    ctx.fill();

    // Eyes (crying mode)
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(player.x + 22, player.y - 14, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(player.x + 38, player.y - 14, 4, 0, Math.PI * 2);
    ctx.fill();

    if (player.sprint) {
        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(player.x + 22, player.y - 10);
        ctx.lineTo(player.x + 18, player.y + 20);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(player.x + 38, player.y - 10);
        ctx.lineTo(player.x + 42, player.y + 20);
        ctx.stroke();
    }

    ctx.restore();
}

// ===========================================================
// LOVE EFFECT
// ===========================================================
function spawnLove() {
    loveFX.push({
        x: player.x + 30,
        y: player.y - 20,
        vy: -2,
        alpha: 1
    });
}

function drawLove() {
    for (let i = loveFX.length - 1; i >= 0; i--) {
        let fx = loveFX[i];

        ctx.save();
        ctx.globalAlpha = fx.alpha;
        ctx.fillStyle = "pink";

        ctx.beginPath();
        ctx.moveTo(fx.x, fx.y);
        ctx.arc(fx.x - 5, fx.y, 6, 0, Math.PI * 2);
        ctx.arc(fx.x + 5, fx.y, 6, 0, Math.PI * 2);
        ctx.lineTo(fx.x, fx.y + 10);
        ctx.fill();

        ctx.restore();

        fx.y += fx.vy;
        fx.alpha -= 0.03;

        if (fx.alpha <= 0) loveFX.splice(i, 1);
    }
}

// ===========================================================
// DRAW OBSTACLE (CARTOON)
// ===========================================================
function drawObstacle(o) {
    ctx.fillStyle = "#ffe08a";
    ctx.fillRect(o.x, o.y, o.width, o.height);

    ctx.fillStyle = "#444";
    ctx.font = "14px sans-serif";
    ctx.fillText(o.label, o.x + 4, o.y + 35);
}

// ===========================================================
// DRAW FARHANT (CARTOON BIRD)
// ===========================================================
function drawFarhant(f) {
    ctx.fillStyle = "#aaddff";
    ctx.beginPath();
    ctx.ellipse(f.x + 25, f.y + 20, 25, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(f.x + 35, f.y + 15, 4, 0, Math.PI * 2);
    ctx.fill();
}

// ===========================================================
// SPAWN OBSTACLE
// ===========================================================
function spawnObstacle() {
    obstacles.push({
        x: canvas.width + 20,
        y: 200,
        width: 60,
        height: 60,
        label: "Masalah " + (Math.floor(Math.random() * 8) + 1)
    });
}

// SPAWN FARHANT
function spawnFarhant() {
    farhants.push({
        x: canvas.width + 60,
        y: 140,
        width: 50,
        height: 40,
        speed: 4,
        knockback: 0,
        hit: false
    });
}

// ===========================================================
// COLLISION
// ===========================================================
function checkCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// ===========================================================
// JUMP
// ===========================================================
function jump() {
    if (player.onGround && !gameOver) {
        player.vy = -15;
        player.onGround = false;
        spawnLove();
    }
}

// ===========================================================
// GAME LOOP
// ===========================================================
function update() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // BACKGROUND
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // PLAYER PHYSICS
    player.vy += player.gravity;
    player.y += player.vy;

    if (player.y >= 190) {
        player.y = 190;
        player.vy = 0;
        player.onGround = true;
    }

    // SPRINT MODE
    if (sprintHeld && player.energy > 0) {
        player.sprint = true;
        player.speed = 9;
        player.energy -= 0.4;
    } else {
        player.sprint = false;
        player.speed = 6;
        player.energy = Math.min(player.energy + 0.2, player.maxEnergy);
    }

    // OBSTACLES
    obstacleTimer++;
    if (obstacleTimer > obstacleGap) {
        spawnObstacle();
        obstacleTimer = 0;
        obstacleGap = 150 + Math.random() * 140;
    }

    obstacles.forEach(o => {
        o.x -= player.speed;

        drawObstacle(o);

        if (checkCollision(player, o)) {
            gameOver = true;
            document.getElementById("restartScreen").style.display = "flex";
        }
    });

    // FARHANTS
    farhantTimer++;
    if (farhantTimer > 260) {
        spawnFarhant();
        farhantTimer = 0;
    }

    farhants.forEach(f => {
        if (!f.hit) {
            f.x -= f.speed;
        } else {
            f.x += f.knockback;
            f.knockback *= 0.9;
            if (f.knockback < 0.2) f.hit = false;
        }

        drawFarhant(f);

        if (checkCollision(player, f)) {
            f.hit = true;
            f.knockback = 10;
        }
    });

    // DRAW PLAYER & EFFECTS
    drawPlayer();
    drawLove();

    // SCORE
    score += 0.05;
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.fillText("Score: " + Math.floor(score), 760, 30);

    requestAnimationFrame(update);
}

update();
