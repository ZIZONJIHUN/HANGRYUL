import { IDENTITY, determinant, rotation, scaling, shear, reflectX } from './matrix.js';
import { createCanvas } from './canvas.js';

const view = createCanvas(document.getElementById('grid'));
let M = { ...IDENTITY };

const sliders = {
  a: document.getElementById('sa'),
  b: document.getElementById('sb'),
  c: document.getElementById('sc'),
  d: document.getElementById('sd'),
};
const out = {
  matrix: document.getElementById('outMatrix'),
  det: document.getElementById('outDet'),
  detMeaning: document.getElementById('outDetMeaning'),
};

const fmt = (n) => (Math.round(n * 100) / 100).toString();

function syncSlidersFromM() {
  sliders.a.value = M.a; sliders.b.value = M.b;
  sliders.c.value = M.c; sliders.d.value = M.d;
}

function update() {
  out.matrix.innerHTML =
    `[ ${fmt(M.a)}&nbsp;&nbsp;${fmt(M.b)} ]<br>[ ${fmt(M.c)}&nbsp;&nbsp;${fmt(M.d)} ]`;
  const det = determinant(M);
  out.det.textContent = fmt(det);
  out.detMeaning.textContent =
    det === 0 ? '넓이 0 — 한 직선/점으로 붕괴'
    : det < 0 ? `넓이 ${fmt(Math.abs(det))}배 + 뒤집힘(방향 반전)`
    : `넓이 ${fmt(det)}배`;
  view.render(M);
}

function setM(next) {
  M = { ...next };
  syncSlidersFromM();
  update();
}

// 슬라이더 → M
Object.entries(sliders).forEach(([key, el]) => {
  el.addEventListener('input', () => { M[key] = Number(el.value); update(); });
});

// 프리셋 버튼
document.getElementById('presets').addEventListener('click', (e) => {
  const p = e.target.dataset.preset;
  if (!p) return;
  if (p === 'identity') setM(IDENTITY);
  else if (p === 'rotate') setM(rotation(45));
  else if (p === 'scale') setM(scaling(1.5));
  else if (p === 'shear') setM(shear(1));
  else if (p === 'reflect') setM(reflectX());
});

window.addEventListener('resize', () => { view.resize(); update(); });

view.resize();
syncSlidersFromM();
update();
