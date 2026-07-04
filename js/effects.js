// 인터랙티브 시각 효과 — 표시 전용(로직/상태와 무관).
// 포인터 글로우, Canvas 3D 틸트, 스크롤 리빌, 프리셋 하이라이트.

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 1) 카드 포인터 글로우: 마우스 위치를 --mx/--my 로 전달
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// 2) Canvas 3D 틸트 (모션 최소화 설정이면 생략)
const wrap = document.querySelector('.canvas-wrap');
if (wrap && !reduce) {
  wrap.addEventListener('pointermove', (e) => {
    const r = wrap.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    wrap.style.transform = `perspective(900px) rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg)`;
  });
  wrap.addEventListener('pointerleave', () => { wrap.style.transform = ''; });
}

// 3) 스크롤 리빌
const revealables = document.querySelectorAll('.reveal');
if (reduce || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  revealables.forEach((el) => io.observe(el));
}

// 4) 프리셋 선택 하이라이트 (표시용 — 슬라이더를 만지면 해제)
const chips = [...document.querySelectorAll('.chip')];
const presets = document.getElementById('presets');
if (presets) {
  presets.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    chips.forEach((c) => c.classList.toggle('active', c === chip));
  });
}
['sa', 'sb', 'sc', 'sd'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => chips.forEach((c) => c.classList.remove('active')));
});
