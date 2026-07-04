// Canvas 렌더링 — "어떻게 그릴지"만 담당. 행렬은 외부에서 주입.
import { apply, IDENTITY } from './matrix.js';

export function createCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const RANGE = 5; // 좌표축 범위: -5 ~ 5
  let W = 0, H = 0, scale = 1;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W, H) / (2 * RANGE); // 정사각 비율 유지
  }

  // 수학좌표 (x,y) → 화면 픽셀
  const px = (x) => W / 2 + x * scale;
  const py = (y) => H / 2 - y * scale;

  function drawGrid() {
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.12)'; // 옅은 하늘색 격자
    ctx.beginPath();
    for (let i = -RANGE; i <= RANGE; i++) {
      ctx.moveTo(px(i), py(-RANGE)); ctx.lineTo(px(i), py(RANGE));
      ctx.moveTo(px(-RANGE), py(i)); ctx.lineTo(px(RANGE), py(i));
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(226, 240, 255, 0.35)'; // 축
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px(-RANGE), py(0)); ctx.lineTo(px(RANGE), py(0));
    ctx.moveTo(px(0), py(-RANGE)); ctx.lineTo(px(0), py(RANGE));
    ctx.stroke();
  }

  // 단위정사각형 (0,0)-(1,0)-(1,1)-(0,1) 을 M으로 변환해 그린다
  function drawShape(M, stroke, fill, glow) {
    const pts = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]
      .map((p) => apply(M, p.x, p.y));
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 18; }
    ctx.beginPath();
    pts.forEach((p, i) => {
      const X = px(p.x), Y = py(p.y);
      i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
    });
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
  }

  function drawArrow(x, y, color, label) {
    const x0 = px(0), y0 = py(0), x1 = px(x), y1 = py(y);
    ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const h = 11;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - h * Math.cos(ang - 0.4), y1 - h * Math.sin(ang - 0.4));
    ctx.lineTo(x1 - h * Math.cos(ang + 0.4), y1 - h * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(label, x1 + 7, y1 - 7);
  }

  function render(M) {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawShape(IDENTITY, 'rgba(226, 240, 255, 0.35)', 'rgba(226, 240, 255, 0.05)'); // 원본(옅게)
    drawShape(M, '#38bdf8', 'rgba(56, 189, 248, 0.18)', '#38bdf8');                 // 변환 결과 + 글로우
    drawArrow(M.a, M.c, '#f472b6', 'i'); // 변환된 i = (a, c)
    drawArrow(M.b, M.d, '#34d399', 'j'); // 변환된 j = (b, d)
  }

  return { render, resize };
}
