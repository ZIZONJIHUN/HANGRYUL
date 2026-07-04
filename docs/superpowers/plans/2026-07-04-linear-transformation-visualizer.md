# 선형변환 시각화기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 고1 학생이 2×2 행렬로 평면을 변형하며 "선형변환 = AI/그래픽스의 언어"임을 체험하는, 빌드 없는 반응형 정적 웹사이트를 만든다.

**Architecture:** 순수 수학은 `js/matrix.js`(DOM 무관, ESM, 단위 테스트), Canvas 렌더링은 `js/canvas.js`, UI 연결은 `js/app.js`로 역할을 분리한다. 수학 유도·AI 결론은 개념 서술이므로 `index.html`에 정적으로 담는다. 빌드 없이 `index.html` + 정적 자산을 GitHub Pages에 그대로 배포한다.

**Tech Stack:** HTML5, CSS3(모바일 우선), Vanilla JS(ES Modules), Canvas 2D, Node.js 내장 테스트 러너(`node --test`), GitHub Pages.

> 참고 설계 문서: `docs/superpowers/specs/2026-07-04-linear-transformation-visualizer-design.md`

---

## File Structure

| 파일 | 책임 |
|------|------|
| `package.json` | `"type": "module"` 선언 + `test` 스크립트 |
| `index.html` | 4개 섹션(인트로/시각화기/행렬곱 유도/AI 결론). 유도·결론은 정적 콘텐츠 |
| `styles.css` | 반응형 스타일(모바일 우선), CSS 변수 테마 |
| `js/matrix.js` | 순수 수학: `apply`, `determinant`, `multiply`, `rotation`, `scaling`, `shear`, `reflectX`, `IDENTITY` |
| `js/matrix.test.mjs` | `matrix.js` 단위 테스트 (`node --test`) |
| `js/canvas.js` | Canvas 렌더링: 좌표변환·격자·축·도형·기저벡터 화살표·리사이즈 |
| `js/app.js` | UI 연결: 슬라이더/프리셋 이벤트, 행렬·det 패널 갱신 |
| `README.md` | 프로젝트 설명 + GitHub Pages 배포 방법 |

수학적 사실(구현·검증 기준): 행렬 `M=[[a,b],[c,d]]`에 대해 `M·(x,y)=(ax+by, cx+dy)`, `det=ad−bc`(넓이 배율), 변환된 기저는 `i=(1,0)→(a,c)`, `j=(0,1)→(b,d)`. 회전 det=1, 전단 det=1, 대칭 det=−1, 확대 s의 det=s².

---

### Task 1: 프로젝트 스캐폴드

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "linear-transformation-visualizer",
  "version": "1.0.0",
  "description": "선형변환 시각화기 (공통수학1 · 행렬 · AI 연계)",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node --test js/*.test.mjs"
  }
}
```

- [ ] **Step 2: .gitignore 작성**

```gitignore
node_modules/
.DS_Store
Thumbs.db
```

- [ ] **Step 3: 커밋**

```bash
git add package.json .gitignore
git commit -m "chore: 프로젝트 스캐폴드"
```

---

### Task 2: 수학 모델 (`matrix.js`) — TDD

**Files:**
- Test: `js/matrix.test.mjs`
- Create: `js/matrix.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`js/matrix.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apply, determinant, multiply, rotation, scaling, shear, reflectX, IDENTITY } from './matrix.js';

const r = (n) => Math.round(n * 1e6) / 1e6; // 부동소수 반올림

test('항등행렬은 점을 그대로 둔다', () => {
  assert.deepEqual(apply(IDENTITY, 3, 5), { x: 3, y: 5 });
});

test('행렬×벡터 성분 계산: M(1,1)=(ax+by, cx+dy)', () => {
  const M = { a: 2, b: 1, c: 0, d: 3 };
  assert.deepEqual(apply(M, 1, 1), { x: 3, y: 3 });
});

test('행렬식: 항등=1, 대칭=-1, 전단=1', () => {
  assert.equal(determinant(IDENTITY), 1);
  assert.equal(determinant(reflectX()), -1);
  assert.equal(determinant(shear(2)), 1);
});

test('확대 s의 행렬식은 s²', () => {
  assert.equal(determinant(scaling(3)), 9);
});

test('90도 회전은 i=(1,0)을 (0,1)로 보낸다', () => {
  const p = apply(rotation(90), 1, 0);
  assert.equal(r(p.x), 0);
  assert.equal(r(p.y), 1);
});

test('회전행렬의 행렬식은 1', () => {
  assert.equal(r(determinant(rotation(37))), 1);
});

test('항등행렬과의 곱은 자기 자신', () => {
  const M = { a: 2, b: 1, c: 0, d: 3 };
  assert.deepEqual(multiply(IDENTITY, M), M);
});

test('행렬 곱셈은 비교환적이다 (회전·전단 순서)', () => {
  const AB = multiply(rotation(90), shear(1));
  const BA = multiply(shear(1), rotation(90));
  const round = (X) => ({ a: r(X.a), b: r(X.b), c: r(X.c), d: r(X.d) });
  assert.notDeepEqual(round(AB), round(BA));
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `node --test js/matrix.test.mjs`
Expected: FAIL — `Cannot find module './matrix.js'`.

- [ ] **Step 3: 최소 구현 작성**

`js/matrix.js`:
```js
// 순수 수학 모델 — DOM/Canvas를 모름.
// 2×2 행렬은 { a, b, c, d } 로 [[a, b], [c, d]] 를 뜻한다.

export const IDENTITY = { a: 1, b: 0, c: 0, d: 1 };

// 행렬 × 벡터: M·(x,y) = (a x + b y, c x + d y)
export function apply(M, x, y) {
  return { x: M.a * x + M.b * y, y: M.c * x + M.d * y };
}

// 행렬식 = 넓이 배율 (부호는 방향 반전)
export function determinant(M) {
  return M.a * M.d - M.b * M.c;
}

// 행렬 곱 A·B (합성: 먼저 B를, 그다음 A를 적용)
export function multiply(A, B) {
  return {
    a: A.a * B.a + A.b * B.c,
    b: A.a * B.b + A.b * B.d,
    c: A.c * B.a + A.d * B.c,
    d: A.c * B.b + A.d * B.d,
  };
}

// 프리셋 변환들
export function rotation(deg) {
  const t = deg * Math.PI / 180;
  return { a: Math.cos(t), b: -Math.sin(t), c: Math.sin(t), d: Math.cos(t) };
}
export function scaling(s) {
  return { a: s, b: 0, c: 0, d: s };
}
export function shear(k) {
  return { a: 1, b: k, c: 0, d: 1 };
}
export function reflectX() {
  return { a: 1, b: 0, c: 0, d: -1 };
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `node --test js/matrix.test.mjs`
Expected: PASS — 8개 테스트 모두 통과 (`# pass 8`).

- [ ] **Step 5: 커밋**

```bash
git add js/matrix.js js/matrix.test.mjs
git commit -m "feat: 2×2 선형변환 수학 모델 (변환·행렬식·곱·프리셋)"
```

---

### Task 3: HTML 골격 + 정적 콘텐츠 + 반응형 스타일

**Files:**
- Create: `index.html`
- Create: `styles.css`

- [ ] **Step 1: index.html 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>선형변환 시각화기 — 행렬로 보는 AI의 언어</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="hero">
    <p class="eyebrow">공통수학 1 · 행렬 · AI 웹 빌더 탐구</p>
    <h1>행렬을 곱하면 도형이 어떻게 움직일까?</h1>
    <p class="lead">AI는 세상을 <strong>행렬</strong>로 계산합니다. 신경망의 한 층도, 화면 속 그래픽 변환도
      모두 <strong>선형변환</strong>이에요. 2×2 행렬을 직접 조절하며 그 원리를 눈으로 확인해봅시다.</p>
  </header>

  <main>
    <!-- 시각화기 -->
    <section class="card" id="visualizer">
      <h2>① 선형변환 시각화기</h2>
      <div class="viz-grid">
        <div class="canvas-wrap">
          <canvas id="grid" aria-label="선형변환 좌표평면"></canvas>
        </div>
        <div class="panel">
          <div id="presets" class="presets">
            <button class="chip" data-preset="identity">초기화</button>
            <button class="chip" data-preset="rotate">회전 45°</button>
            <button class="chip" data-preset="scale">확대 1.5×</button>
            <button class="chip" data-preset="shear">전단</button>
            <button class="chip" data-preset="reflect">x축 대칭</button>
          </div>
          <div class="sliders">
            <label class="ctrl"><span>a</span><input type="range" id="sa" min="-2" max="2" step="0.1" value="1" /></label>
            <label class="ctrl"><span>b</span><input type="range" id="sb" min="-2" max="2" step="0.1" value="0" /></label>
            <label class="ctrl"><span>c</span><input type="range" id="sc" min="-2" max="2" step="0.1" value="0" /></label>
            <label class="ctrl"><span>d</span><input type="range" id="sd" min="-2" max="2" step="0.1" value="1" /></label>
          </div>
          <dl class="readout">
            <div><dt>변환 행렬 M</dt><dd id="outMatrix" class="mono">–</dd></div>
            <div><dt>행렬식 det</dt><dd id="outDet">–</dd></div>
            <div><dt>의미</dt><dd id="outDetMeaning" class="small">–</dd></div>
          </dl>
          <p class="legend"><span class="dot i"></span>변환된 i=(a,c) &nbsp; <span class="dot j"></span>변환된 j=(b,d)</p>
        </div>
      </div>
    </section>

    <!-- 행렬곱 유도 -->
    <section class="card" id="derivation">
      <h2>② 행렬 × 벡터, 어떻게 계산될까?</h2>
      <div class="step">
        <h3>1. 성분 계산</h3>
        <p>점 <b>(x, y)</b>에 행렬을 곱하면 각 성분은 이렇게 계산됩니다.</p>
        <p class="mono center">M·(x, y) = ( a·x + b·y , &nbsp; c·x + d·y )</p>
      </div>
      <div class="step">
        <h3>2. 예시로 확인</h3>
        <p>M = [[2, 1], [0, 3]] 에 점 (1, 1)을 넣으면
          <b>(2·1 + 1·1, 0·1 + 3·1) = (3, 3)</b> 으로 이동합니다.</p>
      </div>
      <div class="step">
        <h3>3. 기저벡터의 이동으로 보기</h3>
        <p>행렬의 <b>1열 (a, c)</b>는 <b>i=(1,0)</b>이 가는 곳,
          <b>2열 (b, d)</b>는 <b>j=(0,1)</b>이 가는 곳입니다.
          그래서 변환은 "새 기저가 만드는 격자"에 도형을 얹는 것과 같아요.</p>
      </div>
      <div class="step">
        <h3>4. 순서가 중요하다 — 곱셈의 비교환성</h3>
        <p>두 변환을 잇는 것은 <b>행렬의 곱</b>입니다. 그런데 회전→전단과 전단→회전은
          결과가 다릅니다(AB ≠ BA). 위 프리셋을 순서대로 눌러 직접 비교해보세요.</p>
      </div>
    </section>

    <!-- AI 탐구 결론 -->
    <section class="card" id="conclusion">
      <h2>③ 탐구 결론 — 행렬은 AI의 언어</h2>
      <ul class="bullets">
        <li><b>신경망:</b> 신경망의 한 층은 <b>출력 = 가중치행렬 × 입력벡터</b>입니다.
          우리가 만진 M·(x,y)가 바로 그 연산의 축소판이에요.</li>
        <li><b>컴퓨터그래픽스:</b> 게임·웹의 도형 회전·확대·기울임은 전부 이 2×2(3D는 3×3·4×4) 행렬 변환입니다.</li>
        <li><b>행렬식의 의미:</b> det는 넓이가 몇 배가 되는지, 음수면 뒤집힘, 0이면 한 직선으로 붕괴됨을 뜻합니다.
          AI에서 정보가 눌려 사라지는지(det≈0) 판단하는 직관과 통합니다.</li>
        <li><b>한계와 확장:</b> 실제 AI·그래픽스는 수십~수천 차원의 큰 행렬을 다룹니다.
          2×2에서 익힌 원리가 <b>고차원 선형대수</b>로 그대로 확장됩니다.</li>
      </ul>
    </section>
  </main>

  <footer class="foot">
    <p>공통수학 1 · 행렬 · 고1 세특 탐구 프로젝트</p>
  </footer>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: styles.css 작성 (모바일 우선)**

```css
:root {
  --bg: #f7f8fa;
  --card: #ffffff;
  --ink: #1f2937;
  --muted: #6b7280;
  --line: #e5e7eb;
  --brand: #2563eb;
  --i: #ef4444;
  --j: #16a34a;
  --radius: 14px;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", "Apple SD Gothic Neo", sans-serif;
  color: var(--ink);
  background: var(--bg);
  line-height: 1.6;
}

.hero {
  padding: clamp(2rem, 6vw, 4rem) 1.25rem;
  text-align: center;
  background: linear-gradient(160deg, #eef2ff, #f7f8fa);
}
.eyebrow { color: var(--brand); font-weight: 600; font-size: 0.85rem; margin: 0 0 0.5rem; }
.hero h1 { font-size: clamp(1.5rem, 5vw, 2.4rem); margin: 0 0 0.75rem; }
.lead { max-width: 42rem; margin: 0 auto; color: var(--muted); }

main {
  max-width: 62rem;
  margin: 0 auto;
  padding: 1.25rem;
  display: grid;
  gap: 1.25rem;
}

.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: clamp(1.1rem, 3vw, 1.75rem);
}
.card h2 { margin-top: 0; font-size: 1.25rem; }

/* 시각화기 레이아웃: 모바일 세로 스택 */
.viz-grid { display: grid; gap: 1.25rem; }
.canvas-wrap { width: 100%; aspect-ratio: 1 / 1; }
#grid { width: 100%; height: 100%; display: block; touch-action: none; border-radius: 10px; background: #fff; }

.presets { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.chip {
  padding: 0.45rem 0.8rem; font-size: 0.9rem; font-weight: 600;
  color: var(--brand); background: #eef2ff; border: 1px solid #dbe3ff;
  border-radius: 999px; cursor: pointer;
}
.chip:active { transform: translateY(1px); }

.sliders { display: grid; gap: 0.55rem; margin-bottom: 1rem; }
.ctrl { display: grid; grid-template-columns: 1.5rem 1fr; align-items: center; gap: 0.6rem; font-weight: 700; }
.ctrl input[type="range"] { width: 100%; height: 26px; }

.readout { display: grid; gap: 0.6rem; margin: 0 0 0.8rem; }
.readout > div {
  display: flex; justify-content: space-between; align-items: baseline; gap: 0.8rem;
  padding: 0.6rem 0.8rem; background: var(--bg); border-radius: 10px;
}
.readout dt { margin: 0; color: var(--muted); font-size: 0.9rem; }
.readout dd { margin: 0; font-weight: 700; text-align: right; }
.mono { font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace; }
.center { text-align: center; }
.small { font-size: 0.85rem; font-weight: 600; }

.legend { font-size: 0.85rem; color: var(--muted); margin: 0; }
.dot { display: inline-block; width: 0.7rem; height: 0.7rem; border-radius: 50%; vertical-align: middle; margin-right: 0.2rem; }
.dot.i { background: var(--i); }
.dot.j { background: var(--j); }

/* 유도 단계 */
.step { padding: 0.9rem 1rem; border-left: 3px solid var(--brand); background: var(--bg); border-radius: 0 10px 10px 0; margin-bottom: 0.8rem; }
.step h3 { margin: 0 0 0.3rem; font-size: 1rem; color: var(--brand); }
.step p { margin: 0.2rem 0 0; }

.bullets { margin: 0; padding-left: 1.1rem; display: grid; gap: 0.6rem; }
.bullets li { padding-left: 0.2rem; }

.foot { text-align: center; color: var(--muted); padding: 2rem 1rem; font-size: 0.85rem; }

/* 데스크톱: 격자 + 컨트롤 좌우 배치 */
@media (min-width: 760px) {
  .viz-grid { grid-template-columns: 1fr 1fr; align-items: start; }
}
```

- [ ] **Step 3: 확인**

Run: `index.html`을 브라우저로 연다.
Expected: 인트로 + 3개 카드(시각화기/유도/결론)가 보인다. 시각화기는 데스크톱에서 좌우 2열, 좁은 폭에서 세로 스택. 유도 4단계·결론 4불릿의 정적 텍스트가 보인다. Canvas는 비어 있음(정상). 정적 검증만 가능하면 파일의 모든 id(grid, presets, sa, sb, sc, sd, outMatrix, outDet, outDetMeaning)와 UTF-8 한글이 올바른지 확인.

- [ ] **Step 4: 커밋**

```bash
git add index.html styles.css
git commit -m "feat: HTML 골격 + 유도·결론 정적 콘텐츠 + 반응형 스타일"
```

---

### Task 4: Canvas 렌더링 (`canvas.js`)

**Files:**
- Create: `js/canvas.js`

- [ ] **Step 1: canvas.js 작성**

```js
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
```

- [ ] **Step 2: 커밋**

```bash
git add js/canvas.js
git commit -m "feat: Canvas 격자·도형·기저벡터 렌더링"
```

(시각 확인은 Task 5에서 app.js 연결 후 함께 수행한다.)

---

### Task 5: UI 연결 (`app.js`)

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: app.js 작성**

```js
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
```

- [ ] **Step 2: 브라우저에서 동작 확인**

Run: `index.html`을 브라우저로 연다(ES Module이므로 필요 시 로컬 서버 `npx serve` 또는 `python -m http.server`).
Expected:
- 격자 위에 옅은 원본 정사각형과 파란 변환 도형, 빨강 `i`·초록 `j` 화살표가 보인다.
- 슬라이더 a/b/c/d를 움직이면 도형과 화살표가 실시간으로 변형되고, 행렬 M·det·의미 패널이 갱신된다.
- "회전 45°"를 누르면 도형이 회전하고 det≈1, "x축 대칭"은 det=−1(뒤집힘), "확대 1.5×"는 det=2.25배로 표시된다.
- 콘솔 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add js/app.js
git commit -m "feat: 슬라이더·프리셋·행렬/det 패널 연결"
```

---

### Task 6: README + GitHub Pages 배포 안내

**Files:**
- Create: `README.md`

- [ ] **Step 1: README.md 작성**

````markdown
# 선형변환 시각화기 (행렬)

공통수학 1 · 행렬 · 고1 세특(AI 웹 빌더 연계) 탐구 프로젝트.

2×2 행렬로 평면을 변형하며 "선형변환 = 신경망·컴퓨터그래픽스의 언어"임을
직접 체험하는 반응형 웹 시각화기입니다.

## 구성
- **시각화기**: 슬라이더·프리셋으로 변환 행렬을 조절 → 도형·기저벡터 실시간 변형 + 행렬식(넓이 배율)
- **행렬곱 유도**: M·(x,y) 성분 계산과 기저벡터 이동 관점, 곱셈의 비교환성
- **AI 탐구 결론**: 신경망 층(가중치행렬×입력)·컴퓨터그래픽스·det의 의미와 고차원 확장

## 로컬 실행
빌드가 필요 없습니다. `index.html`을 브라우저로 열면 됩니다.
(ES Module 사용으로 일부 브라우저는 로컬 서버가 필요할 수 있습니다: `npx serve`.)

## 테스트
```bash
npm test        # node --test js/*.test.mjs  (수학 모델 단위 테스트)
```

## GitHub Pages 배포
1. GitHub에 저장소를 만들고 푸시한다.
2. 저장소 **Settings → Pages**로 이동.
3. **Source**: `Deploy from a branch`, **Branch**: `main` / `(root)` 선택 후 저장.
4. 잠시 후 `https://<사용자명>.github.io/<저장소명>/` 에서 확인.

## 기술
HTML5 · CSS3(반응형) · Vanilla JS(ES Modules) · Canvas 2D · 빌드 없음
````

- [ ] **Step 2: 전체 테스트 재확인**

Run: `npm test`
Expected: PASS — 모든 모델 테스트 통과 (`# pass 8`).

- [ ] **Step 3: 커밋**

```bash
git add README.md
git commit -m "docs: README 및 GitHub Pages 배포 안내"
```

---

## Self-Review

**Spec 커버리지 점검:**
- 수학 모델(§3): apply/determinant/multiply/프리셋 → Task 2 ✓
- 화면 구성 4섹션(§4): 인트로·시각화기 → Task 3·5, 행렬곱 유도·AI 결론(정적) → Task 3 ✓
- 코드 구조 역할 분리(§5): matrix/canvas/app → Task 2·4·5 ✓
- 반응형/모바일(§6): 모바일 우선 CSS·세로/좌우 배치·`devicePixelRatio` 보정·정사각 비율·네이티브 range → Task 3·4 ✓
- 배포·검증(§7): 빌드 없음·`npm test`·브라우저 수동 확인·README → Task 1·6 ✓
- 범위 밖(§8): 3D·고차원·이미지 픽셀 처리는 결론에서 언급만 → Task 3 ✓

**플레이스홀더 점검:** TBD/TODO/막연한 지시 없음 — 모든 코드 단계에 실제 코드 포함 ✓

**타입/이름 일관성:** 행렬 표현 `{a,b,c,d}`가 matrix.js·canvas.js·app.js 전반에서 동일 ✓. `apply(M,x,y)→{x,y}`, `determinant(M)`, `multiply(A,B)`, `rotation/scaling/shear/reflectX`, `IDENTITY`, `createCanvas(canvas)→{render,resize}` 이 Task 2·4·5에서 일관되게 사용됨 ✓. DOM id(grid, presets, sa, sb, sc, sd, outMatrix, outDet, outDetMeaning)가 index.html과 app.js에서 일치 ✓.

**주의(비블로킹):** 슬라이더 step=0.1이라 프리셋(예: 회전 45°의 0.71)을 누르면 슬라이더 썸 위치는 가장 가까운 스텝으로 스냅될 수 있으나, 패널의 행렬·det 표시는 실제 M 값을 그대로 보여주므로 학습에 지장 없음(설계 의도된 단순화).
