const canvas = document.getElementById('hearts');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');

const COLORS = ['#ff4d6d', '#ff8fa3', '#ffffff', '#ffb3c1'];
let hearts = [];
let sparks = [];   // fireworks particles
let stars = [];    // night sky stars
let isNight = false;
let shooters = []; // shooting stars

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  stars = Array.from({ length: 130 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.4 + 0.4,
    phase: Math.random() * 6
  }));
}

// Twinkling stars: brightness follows a sine wave
// Shooting stars: a short fading line that streaks across the sky
function drawShootingStars() {
  if (Math.random() < 0.004) {
    shooters.push({
      x: canvas.width * (0.3 + Math.random() * 0.7),
      y: Math.random() * canvas.height * 0.4,
      vx: -9, vy: 5, life: 1
    });
  }
  shooters.forEach(st => {
    st.x += st.vx;
    st.y += st.vy;
    st.life -= 0.015;
    const tx = st.x - st.vx * 6;      // tail end of the line
    const ty = st.y - st.vy * 6;
    const g = ctx.createLinearGradient(st.x, st.y, tx, ty);
    g.addColorStop(0, `rgba(255,255,255,${Math.max(st.life, 0)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(st.x, st.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  });
  shooters = shooters.filter(st => st.life > 0);
}

function drawStars() {
  const t = Date.now() / 600;
  stars.forEach(st => {
    ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t + st.phase));
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function makeHeart() {
  return {
    x: Math.random() * canvas.width,
    y: -20,
    size: 6 + Math.random() * 12,
    speed: 0.6 + Math.random() * 1.4,
    sway: Math.random() * Math.PI * 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]
  };
}

// Draws one heart shape using two curves
function drawHeart(h) {
  const s = h.size;
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.fillStyle = h.color;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(0, s / 4);
  ctx.bezierCurveTo(-s, -s / 2, -s, s, 0, s * 1.2);
  ctx.bezierCurveTo(s, s, s, -s / 2, 0, s / 4);
  ctx.fill();
  ctx.restore();
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (isNight) { drawStars(); drawShootingStars(); }

  if (hearts.length < 90 && Math.random() < 0.5) hearts.push(makeHeart());

  hearts.forEach(h => {
    h.y += h.speed;
    h.sway += 0.03;
    h.x += Math.sin(h.sway) * 0.5;
    drawHeart(h);
  });

  // fireworks: each spark flies out, slows down, and fades
  sparks.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy = p.vy * 0.96 + 0.02;
    p.life -= 0.012;
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  sparks = sparks.filter(p => p.life > 0);

  hearts = hearts.filter(h => h.y < canvas.height + 30);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
resize();
animate();

// ---------- Music ----------
const music = document.getElementById('music');
music.volume = 0.6;

function startMusic() {
  music.play().catch(err => console.error('Music play error:', err.name, err.message));
}
// Shows in the browser console (F12) if the file path/name is wrong
music.addEventListener('error', () => console.error('Music file not loaded:', music.src));

// Browsers only allow sound after a user action, so start on the first tap
window.addEventListener('pointerdown', startMusic, { once: true });

// ---------- Screen 1 -> Screen 2 ----------
const card = document.getElementById('card');

setTimeout(() => {
  loader.classList.add('hide');
  card.classList.remove('hidden');
}, 3000);

// ---------- Buttons ----------
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
let dodges = 0;

const noTexts = ['Pretty please? 🥺', 'Think again...', 'Are you sure? 😢',
                 'Last chance 💔', 'Nope 😜'];

// Keeps the No button fully inside the visible screen (also on small phones)
const MARGIN = 12;
function clampToScreen(x, y) {
  const maxX = document.documentElement.clientWidth - noBtn.offsetWidth - MARGIN;
  const maxY = document.documentElement.clientHeight - noBtn.offsetHeight - MARGIN;
  return [
    Math.min(Math.max(MARGIN, x), Math.max(MARGIN, maxX)),
    Math.min(Math.max(MARGIN, y), Math.max(MARGIN, maxY))
  ];
}

// "No" glides away slowly (CSS transition) and shows a new text each time
let lastDodge = 0;
function dodge() {
  const now = Date.now();
  if (now - lastDodge < 300) return;   // a single tap on a phone fires several events
  lastDodge = now;

  noBtn.textContent = noTexts[dodges % noTexts.length];
  dodges++;
  yesBtn.style.transform = `scale(${Math.min(1 + dodges * 0.12, 1.9)})`;   // Yes grows

  const r = noBtn.getBoundingClientRect();      // where it is right now
  if (noBtn.parentElement !== document.body) {  // first time: leave the card
    document.body.appendChild(noBtn);
    noBtn.style.position = 'fixed';
    noBtn.style.left = r.left + 'px';
    noBtn.style.top = r.top + 'px';
    noBtn.getBoundingClientRect();              // force layout so the glide animates
  }

  // move only a short distance (120-220px) in a random direction, then keep it on screen
  const angle = Math.random() * Math.PI * 2;
  const dist = 120 + Math.random() * 100;
  const [x, y] = clampToScreen(r.left + Math.cos(angle) * dist, r.top + Math.sin(angle) * dist);
  noBtn.style.left = x + 'px';
  noBtn.style.top = y + 'px';
}
noBtn.addEventListener('pointerenter', dodge);
noBtn.addEventListener('click', dodge);

// If the phone is rotated or the browser bar changes size, pull the button back on screen
window.addEventListener('resize', () => {
  if (noBtn.parentElement !== document.body) return;
  const r = noBtn.getBoundingClientRect();
  const [x, y] = clampToScreen(r.left, r.top);
  noBtn.style.left = x + 'px';
  noBtn.style.top = y + 'px';
});

// ---------- Screen 3: gift ----------
const gift = document.getElementById('gift');
const giftBox = document.getElementById('giftBox');
const giftHint = document.getElementById('giftHint');
const giftNote = document.getElementById('giftNote');
const fireBtn = document.getElementById('fireBtn');

// Typewriter: the note is written letter by letter
const fullNote = Array.from(giftNote.innerHTML);   // every character, tags included
function typeNote() {
  let i = 0;
  giftNote.innerHTML = '';
  const timer = setInterval(() => {
    if (fullNote[i] === '<') i = fullNote.indexOf('>', i);   // skip a whole tag at once
    i++;
    giftNote.innerHTML = fullNote.slice(0, i).join('');
    if (i >= fullNote.length) {
      clearInterval(timer);
      fireBtn.hidden = false;        // show the fireworks button after typing ends
    }
  }, 70);
}

yesBtn.addEventListener('click', () => {
  noBtn.remove();                       // No is no longer needed
  card.classList.add('hidden');
  gift.classList.remove('hidden');
});

giftBox.addEventListener('click', () => {
  giftBox.textContent = '💌';
  giftBox.classList.add('open');
  giftHint.hidden = true;
  giftNote.hidden = false;
  typeNote();
  // small burst of hearts from the middle
  for (let i = 0; i < 40; i++) {
    const h = makeHeart();
    h.x = canvas.width / 2 + (Math.random() - 0.5) * 200;
    h.y = canvas.height / 2;
    hearts.push(h);
  }
});

// ---------- Screen 4: night sky ----------
const sky = document.getElementById('sky');
const backBtn = document.getElementById('backBtn');
const FIRE_COLORS = ['#ff4d6d', '#ffd166', '#ff8fa3', '#ffffff', '#ff9e00'];

// Heart-shaped firework: each spark flies along a point of a heart curve
function launchFirework(x, y) {
  const color = FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)];
  const COUNT = 70;
  for (let i = 0; i < COUNT; i++) {
    const t = (i / COUNT) * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    sparks.push({ x, y, vx: hx * 0.35, vy: hy * 0.35, life: 1, color });
  }
}

fireBtn.addEventListener('click', () => {
  gift.classList.add('hidden');
  sky.classList.remove('hidden');
  document.documentElement.classList.add('night');
  isNight = true;
});

backBtn.addEventListener('click', () => {
  sky.classList.add('hidden');
  gift.classList.remove('hidden');
  document.documentElement.classList.remove('night');
  isNight = false;
});

// Tap on the sky (canvas) launches a firework, only while the sky screen is visible
canvas.addEventListener('pointerdown', e => {
  if (!sky.classList.contains('hidden')) launchFirework(e.clientX, e.clientY);
});

// ---------- Heart trail: small hearts follow the finger / mouse ----------
let lastTrail = 0;
window.addEventListener('pointermove', e => {
  const now = Date.now();
  if (now - lastTrail < 40) return;      // at most one heart every 40 ms
  lastTrail = now;
  const h = makeHeart();
  h.x = e.clientX;
  h.y = e.clientY;
  h.size = 4 + Math.random() * 5;
  hearts.push(h);
});

// ---------- Counter: how long we have been together ----------
const START = new Date(2025, 8, 19);      // 19 Sept 2026 (month is 0-based: 8 = September)
const together = document.getElementById('together');
const bn = n => n.toLocaleString('bn-BD'); // 10 -> ১০ (Bangla digits)

function updateTogether() {
  const diff = Math.max(0, Date.now() - START.getTime());   // milliseconds since that day
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000) % 24;
  const mins = Math.floor(diff / 60000) % 60;
  const secs = Math.floor(diff / 1000) % 60;
  together.textContent =
    `একসাথে ${bn(days)} দিন ${bn(hours)} ঘণ্টা ${bn(mins)} মিনিট ${bn(secs)} সেকেন্ড ❤️`;
}
updateTogether();
setInterval(updateTogether, 1000);
