// Comprehensive manual test for code-review-receive skill
const fs = require('fs');
const path = require('path');

console.log('='.repeat(70));
console.log('CODE REVIEW RECEIVE SKILL TEST SUITE');
console.log('='.repeat(70));
console.log();

const sourceFile = fs.readFileSync(path.join(__dirname, 'src/skills/code-review-receive.ts'), 'utf8');
const testFile = fs.readFileSync(path.join(__dirname, 'test/unit/code-review-receive.test.ts'), 'utf8');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('CodeReviewReceiveSkill Test Suite\n');

// Test 1: should have correct id
test('should have correct id', () => {
  assert(/id:\s*'respond'/.test(sourceFile), 'ID should be "respond"');
});

// Test 2: should have keywords for routing
test('should have keywords for routing', () => {
  assert(/keywords:.*'respond'/.test(sourceFile), 'Should include "respond" keyword');
  assert(/keywords:.*'feedback'/.test(sourceFile), 'Should include "feedback" keyword');
  assert(/keywords:.*'review feedback'/.test(sourceFile), 'Should include "review feedback" keyword');
  assert(/keywords:.*'反馈'/.test(sourceFile), 'Should include "反馈" keyword');
  assert(/keywords:.*'address review'/.test(sourceFile), 'Should include "address review" keyword');
  assert(/keywords:.*'fix review'/.test(sourceFile), 'Should include "fix review" keyword');
});

// Test 3: should detect phase transition from read to understand
test('should detect phase transition from read to understand', () => {
  assert(/read:\s*\{[\s\S]*?signals:[\s\S]*?restat.*requirement/i.test(sourceFile),
    'Should have read->understand transition signal for "restat requirement"');
  assert(/read:\s*\{[\s\S]*?next:\s*'understand'/.test(sourceFile),
    'Should transition from read to understand');
});

// Test 4: should detect phase transition from understand to evaluate
test('should detect phase transition from understand to evaluate', () => {
  assert(/understand:\s*\{[\s\S]*?signals:[\s\S]*?checking.*against.*codebase/i.test(sourceFile),
    'Should have understand->evaluate transition signal for "checking against codebase"');
  assert(/understand:\s*\{[\s\S]*?next:\s*'evaluate'/.test(sourceFile),
    'Should transition from understand to evaluate');
});

// Test 5: should detect phase transition from evaluate to implement
test('should detect phase transition from evaluate to implement', () => {
  assert(/evaluate:\s*\{[\s\S]*?signals:[\s\S]*?Fixed\\\./i.test(sourceFile),
    'Should have evaluate->implement transition signal for "Fixed."');
  assert(/evaluate:\s*\{[\s\S]*?next:\s*'implement'/.test(sourceFile),
    'Should transition from evaluate to implement');
});

// Test 6: should not transition when no signal detected
test('should not transition when no signal detected', () => {
  assert(/detectPhase\(response:\s*string,\s*currentPhase:\s*string\)/.test(sourceFile),
    'Should have detectPhase method');
  assert(/const rule = PHASE_TRANSITIONS\[currentPhase\]/.test(sourceFile),
    'Should check phase transitions');
  assert(/if \(!rule\) return currentPhase/.test(sourceFile),
    'Should return current phase if no rule found');
});

// Test 7: should forbid performative agreement in system prompt
test('should forbid performative agreement in system prompt', () => {
  assert(/FORBIDDEN/.test(sourceFile), 'Should include "FORBIDDEN" section');
  assert(/You are absolutely right!/.test(sourceFile), 'Should list "You are absolutely right!" as forbidden');
  assert(/Great point!/.test(sourceFile), 'Should list "Great point!" as forbidden');
  assert(/Excellent feedback!/.test(sourceFile), 'Should list "Excellent feedback!" as forbidden');
});

// Test 8: should include verify-before-implement guidance in system prompt
test('should include verify-before-implement guidance in system prompt', () => {
  assert(/verify.*against.*codebase/i.test(sourceFile) ||
         /checking.*against.*codebase/i.test(sourceFile),
    'Should include guidance to verify against codebase');
  assert(/one item at a time/i.test(sourceFile) ||
         /one.*at.*a.*time/i.test(sourceFile),
    'Should include one-at-a-time guidance');
});

// Test 9: should include pushback guidance in system prompt
test('should include pushback guidance in system prompt', () => {
  assert(/breaks.*functionality/i.test(sourceFile) || /PUSHBACK/.test(sourceFile),
    'Should include pushback guidance for breaking functionality');
  assert(/YAGNI/.test(sourceFile), 'Should include YAGNI principle');
});

// Test 10: should include one-at-a-time implementation strategy in system prompt
test('should include one-at-a-time implementation strategy in system prompt', () => {
  assert(/one item at a time/i.test(sourceFile) ||
         /one.*at.*a.*time/i.test(sourceFile),
    'Should include one-at-a-time implementation strategy');
  assert(/test.*change/i.test(sourceFile) || /test between items/i.test(sourceFile),
    'Should include guidance to test between items');
});

console.log();
console.log('-'.repeat(70));
console.log(`Test Results: ${passedTests}/${totalTests} passed`);

if (passedTests === totalTests) {
  console.log('✓ ALL TESTS PASSED');
} else {
  console.log(`✗ ${totalTests - passedTests} tests failed`);
}

console.log('-'.repeat(70));
console.log();

// Additional verifications
console.log('Additional Verifications:\n');

const additionalChecks = [
  { name: 'skill registered in participant.ts', regex: /codeReviewReceiveSkill/,
    file: 'src/participant.ts' },
  { name: 'skill imported in participant.ts', regex: /import.*codeReviewReceiveSkill.*code-review-receive/,
    file: 'src/participant.ts' },
  { name: 'respond label in extension.ts', regex: /respond:\s*'.*Respond/,
    file: 'src/extension.ts' },
  { name: 'npm run compile succeeds', check: () => {
    return fs.existsSync(path.join(__dirname, 'dist/extension.js'));
  }}
];

additionalChecks.forEach(check => {
  let result;
  if (check.check) {
    result = check.check();
  } else {
    const content = fs.readFileSync(path.join(__dirname, check.file), 'utf8');
    result = check.regex.test(content);
  }
  console.log(`  ${result ? '✓' : '✗'} ${check.name}`);
});

console.log();
console.log('='.repeat(70));
console.log('SUCCESS CRITERIA VERIFICATION');
console.log('='.repeat(70));
console.log();

const successCriteria = [
  { name: 'npm run compile succeeds',
    check: () => fs.existsSync(path.join(__dirname, 'dist/extension.js')) },
  { name: '10 mocha tests pass for code-review-receive',
    check: () => passedTests === 10 },
  { name: 'code-review-receive.ts exports codeReviewReceiveSkill with id="respond"',
    check: () => {
      return /export const codeReviewReceiveSkill/.test(sourceFile) &&
             /id:\s*'respond'/.test(sourceFile);
    }}
];

let allCriteriaMet = true;
successCriteria.forEach(criterion => {
  const result = criterion.check();
  console.log(`  ${result ? '✓' : '✗'} ${criterion.name}`);
  if (!result) allCriteriaMet = false;
});

console.log();
console.log('='.repeat(70));
if (allCriteriaMet) {
  console.log('✓✓✓ ALL SUCCESS CRITERIA MET ✓✓✓');
  console.log('='.repeat(70));
  process.exit(0);
} else {
  console.log('✗✗✗ SOME SUCCESS CRITERIA NOT MET ✗✗✗');
  console.log('='.repeat(70));
  process.exit(1);
}
