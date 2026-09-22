import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../../../functions/submitWheelOfLife.ts',import.meta.url),'utf8');
test('notification summary avoids a fabricated strongest or weakest category on ties',()=>{
  assert.match(code,/maxScore === minScore/);
  assert.match(code,/אין תחום בולט/);
});
test('notification requires high-rated strength and low-rated opportunity',()=>{
  assert.match(code,/score >= 8/);
  assert.match(code,/score <= 5/);
});
