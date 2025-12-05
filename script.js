// script.js - gunakan assets yang udah ada di folder assets/
// filenames sesuai screenshot disebutkan: bg.jpg, farhant.jpeg, obs1.png, obs2.png, obs3.jpg, obs4.jpg
// salma_run.jpeg, salma_sprint.jpeg, salma_jump.jpeg, salma_nangis.jpeg

/* ---------- CANVAS SETUP ---------- */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

function resizeCanvas(){
  // lebih tinggi untuk mobile (user minta layar lebih gede)
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * (window.devicePixelRatio || 1));
  canvas.height = Math.floor(rect.height * (window.devicePixelRatio || 1));
  ctx.setTransform(window.devicePixelRatio || 1,0,0,window.devicePixelRatio || 1,0,0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* ---------- ASSETS (preload) ---------- */
const ASSETS = {
  bg: 'assets/bg.jpg',
  salmaRun: 'assets/salma_run.jpeg',
  salmaSprint: 'assets/salma_sprint.jpeg',
  salmaJump: 'assets/salma_jump.jpeg',
  salmaCry: 'assets/salma_nangis.jpeg',
  farhant: 'assets/farhant.jpeg',
  obs1: 'assets/obs1.png',
  obs2: 'assets/obs2.png',
  obs3: 'assets/obs3.jpg',
  obs4: 'assets/obs4.jpg'
};

const imgs = {};
let toLoad = Object.keys(ASSETS).length;
let loaded = 0;
let failed = 0;

function tryLoadAll(cb){
  for(let k in ASSETS){
    const i = new Image();
    i.src = ASSETS[k] + '?v=1'; // cache-buster slight
    i.onload = ()=>{ imgs[k]=i; loaded++; if(loaded+failed===toLoad) cb(); };
    i.onerror = ()=>{ console.warn('failed load', k, ASSETS[k]); failed++; imgs[k]=null; if(loaded+failed===toLoad) cb(); };
  }
}
tryLoadAll(init);

/* ---------- GAME STATE ---------- */
let lastTime = performance.now();
let dt = 0;
let gameOver = false;
let score = 0;

const player = {
  x: 120,
  y: 0,
  w: 120,
  h: 120,
  vy: 0,
  gravity: 40, // pixels/sec^2 scaled by dt
  onGround: false,
  state: 'run', // run, jump, sprint
  energy: 100,
  maxEnergy: 100
};

const groundY = () => (canvas.height / (window.devicePixelRatio || 1)) - 110;

let obstacles = [];
let obstacleTimer = 0;
let obstacleMinGap = 900; // ms
let obstacleMaxGap = 1700;

let farhants = [];
let farhantTimer = 0;
let farhantGap = 2200; // ms

/* control */
let sprintHeld = false;

/* prevent default longpress select */
function preventSelection(e){ e.preventDefault(); }
document.addEventListener('touchmove', preventSelection, {passive:false});

/* UI elems */
const scoreEl = document.getElementById('score');
const energyBar = document.getElementById('energyBar');
const btnSprint = document.getElementById('btnSprint');
const overlay = document.getElementById('overlay');
const finalScore = document.getElementById('finalScore');
const btnRestart = document.getElementById('btnRestart');

/* ---------- INPUT: tap for jump, long-press for repeated jump (and avoid blue selection) ---------- */
let jumpHold = false;
let jumpRepeatTimer = 0;
const JUMP_REPEAT_INTERVAL = 220; // ms between repeated jumps while holding

function doJump(){
  if(gameOver) return;
  if(player.onGround){
    player.vy = -18; // tinggi lompatan (naikin daripada sebelumnya)
    player.onGround = false;
    player.state = 'jump';
    spawnLoveEffect();
  }
}

// touch / mouse
canvas.addEventListener('touchstart', e=>{
  e.preventDefault();
  // single tap -> jump; long-hold -> repeated jump
  jumpHold = true;
  doJump();
});
canvas.addEventListener('touchend', e=>{
  e.preventDefault();
  jumpHold = false;
});
canvas.addEventListener('mousedown', e=>{
  e.preventDefault();
  jumpHold = true;
  doJump();
});
document.addEventListener('mouseup', e=>{
  jumpHold = false;
});

/* repeated jump loop */
function handleJumpHold(elapsed){
  if(jumpHold){
    jumpRepeatTimer += elapsed;
    if(jumpRepeatTimer >= JUMP_REPEAT_INTERVAL){
      doJump();
      jumpRepeatTimer = 0;
    }
  } else {
    jumpRepeatTimer = 0;
  }
}

/* ---------- SPRINT button touch handlers (with proper touch events) ---------- */
btnSprint.addEventListener('touchstart', e=>{ e.preventDefault(); sprintHeld=true; player.state='sprint'; });
btnSprint.addEventListener('touchend', e=>{ e.preventDefault(); sprintHeld=false; player.state='run'; });
btnSprint.addEventListener('mousedown', e=>{ e.preventDefault(); sprintHeld=true; player.state='sprint'; });
document.addEventListener('mouseup', e=>{ sprintHeld=false; player.state='run'; });

/* ---------- EFFECTS: love and crying (drawn using images / canvas) ---------- */
let loveParticles = [];
function spawnLoveEffect(){
  for(let i=0;i<6;i++){
    loveParticles.push({
      x: player.x + player.w*0.5 + (Math.random()*40-20),
      y: player.y + 10,
      vy: - (80 + Math.random()*40),
      life: 0.9 + Math.random()*0.8,
      t: 0
    });
  }
}
function updateLove(dt){
  for(let i=loveParticles.length-1;i>=0;i--){
    const p = loveParticles[i];
    p.t += dt;
    p.y += p.vy * dt;
    p.vy += 300 * dt;
    if(p.t > p.life) loveParticles.splice(i,1);
  }
}

/* ---------- spawn obstacle & farhant ---------- */
function spawnObstacle(){
  const imgsArr = ['obs1','obs2','obs3','obs4'];
  const pick = imgsArr[Math.floor(Math.random()*imgsArr.length)];
  obstacles.push({
    x: (canvas.width/(window.devicePixelRatio||1)) + 40,
    y: groundY() - 60,
    w: 90,
    h: 90,
    imgKey: pick,
    id: Math.floor(Math.random()*9999)
  });
}

function spawnFarhant(){
  farhants.push({
    x: (canvas.width/(window.devicePixelRatio||1)) + 80,
    y: groundY() - 120 - Math.random()*30,
    w: 72,
    h: 72,
    vx: 130 + Math.random()*60,
    knock: 0,
    hit: false
  });
}

/* ---------- collision helper ---------- */
function rectCollide(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* ---------- update & draw ---------- */
function init(){
  // set initial player pos
  player.y = groundY() - player.h;
  player.onGround = true;

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function loop(ts){
  const elapsed = (ts - lastTime)/1000;
  lastTime = ts;

  // handle repeated jump hold
  handleJumpHold(elapsed*1000);

  // update physics
  // gravity scaled
  player.vy += player.gravity * elapsed;
  player.y += player.vy;

  if(player.y >= groundY() - player.h){
    player.y = groundY() - player.h;
    player.vy = 0;
    player.onGround = true;
    if(player.state === 'jump') player.state = 'run';
  }

  // sprint logic (speed + energy)
  if(sprintHeld && player.energy > 0){
    player.speed = 12;
    player.energy = Math.max(0, player.energy - 60 * elapsed); // drain per second
    player.state = 'sprint';
  } else {
    player.speed = 7;
    player.energy = Math.min(player.maxEnergy, player.energy + 18 * elapsed); // regen slow
    if(player.state !== 'jump') player.state = 'run';
  }

  // update timers & spawn
  obstacleTimer += elapsed*1000;
  if(obstacleTimer > (obstacleMinGap + Math.random()*(obstacleMaxGap - obstacleMinGap))){
    spawnObstacle();
    obstacleTimer = 0;
  }

  farhantTimer += elapsed*1000;
  if(farhantTimer > (farhantGap + Math.random()*1200)){
    spawnFarhant();
    farhantTimer = 0;
  }

  // move obstacles
  for(let i=obstacles.length-1;i>=0;i--){
    const o = obstacles[i];
    o.x -= player.speed * elapsed * 60;
    if(o.x + o.w < -50) obstacles.splice(i,1);
  }

  // move farhants
  for(let i=farhants.length-1;i>=0;i--){
    const f = farhants[i];
    if(!f.hit){
      f.x -= (f.vx * elapsed);
    } else {
      // knockback effect (mental)
      f.x += f.knock * elapsed * 60;
      f.knock *= 0.92;
      if(Math.abs(f.knock) < 0.3) f.hit = false;
    }
    if(f.x + f.w < -80) farhants.splice(i,1);
  }

  // collision checks
  // obstacle collision -> game over
  for(const o of obstacles){
    if(rectCollide(player, {x:o.x,y:o.y,w:o.w,h:o.h})){
      gameOver = true;
      showGameOver();
    }
  }

  // farhant collision -> mental (random direction)
  for(const f of farhants){
    if(rectCollide(player, {x:f.x,y:f.y,w:f.w,h:f.h})){
      if(!f.hit){
        f.hit = true;
        // random knock direction
        f.knock = (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random()*200);
        score += 25;
      }
    }
  }

  // score increases with time & speed
  score += (player.speed / 60) * elapsed * 100;
  scoreElUpdate();

  // update love particles
  updateLove(elapsed);

  // draw everything
  drawFrame();

  // ensure loop keeps running unless gameOver
  if(!gameOver) requestAnimationFrame(loop);
}

/* ---------- drawing ---------- */
function drawFrame(){
  // clear
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const W = canvas.width / (window.devicePixelRatio||1);
  const H = canvas.height / (window.devicePixelRatio||1);

  // background (use image if loaded)
  if(imgs.bg){
    ctx.drawImage(imgs.bg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#a3e4ff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  // ground strip
  ctx.fillStyle = '#e9d7c0';
  ctx.fillRect(0, groundY(), W, H - groundY());

  // obstacles
  for(const o of obstacles){
    // draw image if loaded else fallback box
    if(imgs[o.imgKey]){
      ctx.drawImage(imgs[o.imgKey], o.x, o.y, o.w, o.h);
    } else {
      ctx.fillStyle = '#ffd86b';
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    ctx.fillStyle = '#2b2b2b';
    ctx.font = '16px sans-serif';
    ctx.fillText('Masalah Hidup ' + o.id, o.x + 6, o.y + o.h - 8);
  }

  // farhants
  for(const f of farhants){
    if(imgs.farhant){
      ctx.drawImage(imgs.farhant, f.x, f.y, f.w, f.h);
    } else {
      // draw simple bird
      ctx.fillStyle = '#9ed8ff';
      ctx.beginPath();
      ctx.ellipse(f.x + f.w/2, f.y + f.h/2, f.w/2, f.h/2, 0,0,Math.PI*2);
      ctx.fill();
    }
  }

  // player (use images from assets if loaded)
  if(player.state === 'sprint' && imgs.salmaSprint){
    ctx.drawImage(imgs.salmaSprint, player.x, player.y, player.w, player.h);
    // draw crying overlay if available (salmaCry) or simple tears
    if(imgs.salmaCry){
      ctx.drawImage(imgs.salmaCry, player.x - 10, player.y - 8, player.w + 20, player.h + 20);
    } else {
      // fallback tear lines
      ctx.strokeStyle = 'rgba(120,200,255,0.95)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(player.x + player.w - 18, player.y + 34); ctx.lineTo(player.x + player.w - 18, player.y + 62); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(player.x + player.w - 34, player.y + 34); ctx.lineTo(player.x + player.w - 34, player.y + 62); ctx.stroke();
    }
  } else if(player.state === 'jump' && imgs.salmaJump){
    ctx.drawImage(imgs.salmaJump, player.x, player.y, player.w, player.h);
  } else if(imgs.salmaRun){
    ctx.drawImage(imgs.salmaRun, player.x, player.y, player.w, player.h);
  } else {
    // fallback simple box
    ctx.fillStyle = '#ffccdd';
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  // love particles draw on top
  for(const p of loveParticles){
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - (p.t / p.life));
    ctx.fillStyle = '#ff7ca0';
    // heart shape quick approx
    const cx = p.x * (window.devicePixelRatio||1);
    const cy = p.y * (window.devicePixelRatio||1);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx-6, cy, 6, 0, Math.PI*2);
    ctx.arc(cx+6, cy, 6, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/* ---------- UI update ---------- */
function scoreElUpdate(){
  scoreEl = Math.floor(score);
  document.getElementById('score').textContent = 'Skor: ' + scoreEl;
  const pct = (player.energy / player.maxEnergy) * 100;
  document.getElementById('energyBar').style.width = pct + '%';
}

/* ---------- Game over UI ---------- */
function showGameOver(){
  overlay.classList.remove('hidden');
  finalScore.textContent = 'Skor kamu: ' + Math.floor(score);
  document.getElementById('finalScore').textContent = 'Skor: ' + Math.floor(score);
  document.getElementById('overlay').style.display = 'flex';
}

/* ---------- Restart button ---------- */
btnRestart.addEventListener('click', ()=>{
  // simple reload to reset everything
  location.reload();
});
