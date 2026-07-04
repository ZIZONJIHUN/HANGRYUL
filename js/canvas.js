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
    ctx.strokeStyle = '#e5e7eb';
    ctx.beginPath();
    for (let i = -RANGE; i <= RANGE; i++) {
      ctx.moveTo(px(i), py(-RANGE)); ctx.lineTo(px(i), py(RANGE));
      ctx.moveTo(px(-RANGE), py(i)); ctx.lineTo(px(RANGE), py(i));
    }
    ctx.stroke();
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px(-RANGE), py(0)); ctx.lineTo(px(RANGE), py(0));
    ctx.moveTo(px(0), py(-RANGE)); ctx.lineTo(px(0), py(RANGE));
    ctx.stroke();
  }

  // 단위정사각형 (0,0)-(1,0)-(1,1)-(0,1) 을 M으로 변환해 그린다
  function drawShape(M, stroke, fill) {
    const pts = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]
      .map((p) => apply(M, p.x, p.y));
    ctx.beginPath();
    pts.forEach((p, i) => {
      const X = px(p.x), Y = py(p.y);
      i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
    });
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
  }

  function drawArrow(x, y, color, label) {
    const x0 = px(0), y0 = py(0), x1 = px(x), y1 = py(y);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const h = 10;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - h * Math.cos(ang - 0.4), y1 - h * Math.sin(ang - 0.4));
    ctx.lineTo(x1 - h * Math.cos(ang + 0.4), y1 - h * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(label, x1 + 6, y1 - 6);
  }

  function render(M) {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawShape(IDENTITY, '#cbd5e1', 'rgba(203,213,225,0.25)'); // 원본(옅게)
    drawShape(M, '#2563eb', 'rgba(37,99,235,0.20)');          // 변환 결과
    drawArrow(M.a, M.c, '#ef4444', 'i'); // 변환된 i = (a, c)
    drawArrow(M.b, M.d, '#16a34a', 'j'); // 변환된 j = (b, d)
  }

  return { render, resize };
}
