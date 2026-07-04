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
