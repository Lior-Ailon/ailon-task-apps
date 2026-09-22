import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeWheel } from '../wheel-analysis.mjs';
const keys = ['health','family','money','environ','leisure','other','growth','career','romance','friends'];
const domains = keys.map((id) => ({ id, label: id === 'other' ? 'אחר' : id }));
const scores = (n) => Object.fromEntries(keys.map((k) => [k,n]));

test('all scores of five yield no invented strength and identify all domains as possible focus', () => {
  const result = analyzeWheel(scores(5),domains);
  assert.deepEqual(result.strengths, []);
  assert.equal(result.opportunities.length,10);
  assert.match(result.interpretation, /דומים|זהים/);
  assert.doesNotMatch(result.interpretation, /החוזקה שלך היא/);
});

test('only scores eight or higher count as strengths; five or lower as growth; six-seven remain neutral', () => {
  const input = scores(7); input.family=8; input.money=5; input.health=3;
  const result = analyzeWheel(input,domains);
  assert.deepEqual(result.strengths.map(d=>d.id),['family']);
  assert.deepEqual(result.opportunities.map(d=>d.id),['health','money']);
  assert.equal(result.stable.length,7);
  assert.match(result.nextStep,/תחום אחד/);
});

test('all high scores yield no arbitrary area for improvement', () => {
  const result=analyzeWheel(scores(9),domains);
  assert.deepEqual(result.opportunities,[]);
  assert.equal(result.strengths.length,10);
  assert.match(result.interpretation,/גבוה/);
});

test('custom domain is visible in generated analysis, including advice', () => {
  const input=scores(7); input.other=4;
  const result=analyzeWheel(input,domains,'לימודים');
  assert.match(result.summaryText,/לימודים/);
  assert.doesNotMatch(result.summaryText,/אחר \(4/);
});

test('intro explains rating and results are presented only after rating', () => {
  const page=readFileSync(new URL('../wheel-of-life.html',import.meta.url),'utf8');
  assert.match(page,/דרגו כל תחום|דרגו את התחומים/);
  assert.match(page,/מה המשמעות של התוצאות/);
  assert.match(page,/\bwheel-analysis\.mjs\?/);
  assert.doesNotMatch(page.split('<!-- WHEEL CANVAS -->')[0],/התוצאות (מראות|מצביעות)/);
});
