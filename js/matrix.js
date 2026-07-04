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
