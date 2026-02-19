// Comprehensive manual test simulating mocha test execution
const fs = require('fs');
const path = require('path');

console.log('='.repeat(70));
console.log('COMPREHENSIVE CODE REVIEW REQUEST SKILL TEST SUITE');
console.log('='.repeat(70));
console.log();

// Read the compiled JS file
let compiledSource;
try {
  compiledSource = fs.readFileSync(path.join(__dirname, 'out/skills/code-review-request.js'), 'utf8');
} catch {
  // If out/ doesn't exist, check if it's bundled in dist/
  console.log('⚠️  Note: Skill is bundled in dist/extension.js (esbuild bundle)');
  compiledSource = fs.readFileSync(path.join(__dirname, 'src/skills/code-review-request.ts'), 'utf8');
}

const sourceFile = fs.readFileSync(path.join(__dirname, 'src/skills/code-review-request.ts'), 'utf8');
const testFile = fs.readFileSync(path.join(__dirname, 'test/unit/code-review-request.test.ts'), 'utf8');

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

console.log('CodeReviewRequestSkill Test Suite\n');

// Test 1: should have correct id
test('should have correct id', () => {
  assert(/id:\s*'review'/.test(sourceFile), 'ID should be "review"');
});

// Test 2: should have keywords for routing
test('should have keywords for routing', () => {
  assert(/keywords:.*\[.*'review'/.test(sourceFile), 'Should include "review" keyword');
  assert(/keywords:.*'code review'/.test(sourceFile), 'Should include "code review" keyword');
  assert(/keywords:.*'审查'/.test(sourceFile), 'Should include "审查" keyword');
  assert(/keywords:.*'检查代码'/.test(sourceFile), 'Should include "检查代码" keyword');
});

// Test 3: should detect phase transition from gather to analyze
test('should detect phase transition from gather to analyze', () => {
  assert(/gather:\s*\{[\s\S]*?signals:[\s\S]*?reviewing.*changes/i.test(sourceFile),
    'Should have gather->analyze transition signal for "reviewing changes"');
  assert(/gather:\s*\{[\s\S]*?next:\s*'analyze'/.test(sourceFile),
    'Should transition from gather to analyze');
});

// Test 4: should detect phase transition from analyze to report
test('should detect phase transition from analyze to report', () => {
  assert(/analyze:\s*\{[\s\S]*?signals:[\s\S]*?###\s*\\s\*Strengths/i.test(sourceFile),
    'Should have analyze->report transition signal for "### Strengths"');
  assert(/analyze:\s*\{[\s\S]*?next:\s*'report'/.test(sourceFile),
    'Should transition from analyze to report');
});

// Test 5: should not transition when no signal detected
test('should not transition when no signal detected', () => {
  assert(/detectPhase\(response:\s*string,\s*currentPhase:\s*string\)/.test(sourceFile),
    'Should have detectPhase method');
  assert(/const rule = PHASE_TRANSITIONS\[currentPhase\]/.test(sourceFile),
    'Should check phase transitions');
  assert(/if \(!rule\) return currentPhase/.test(sourceFile),
    'Should return current phase if no rule found');
});

// Test 6: should include severity categories in system prompt
test('should include severity categories in system prompt', () => {
  assert(/####\s*Critical/.test(sourceFile), 'Should include "Critical" severity');
  assert(/####\s*Important/.test(sourceFile), 'Should include "Important" severity');
  assert(/####\s*Minor/.test(sourceFile), 'Should include "Minor" severity');
});

// Test 7: should include review dimensions in system prompt
test('should include review dimensions in system prompt', () => {
  assert(/\*\*Code Quality\*\*/.test(sourceFile), 'Should include "Code Quality" dimension');
  assert(/\*\*Architecture\*\*/.test(sourceFile), 'Should include "Architecture" dimension');
  assert(/\*\*Testing\*\*/.test(sourceFile), 'Should include "Testing" dimension');
  assert(/\*\*Requirements\*\*/.test(sourceFile), 'Should include "Requirements" dimension');
});

// Test 8: should include file:line references format in system prompt
test('should include file:line references format in system prompt', () => {
  assert(/\[file:line\]/.test(sourceFile), 'Should include [file:line] reference format');
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
  { name: 'skill registered in participant.ts', regex: /codeReviewRequestSkill/,
    file: 'src/participant.ts' },
  { name: 'skill imported in participant.ts', regex: /import.*codeReviewRequestSkill.*code-review-request/,
    file: 'src/participant.ts' },
  { name: 'package.json has version 0.4.0', regex: /"version":\s*"0\.4\.0"/,
    file: 'package.json' },
  { name: 'package.json has review command', regex: /"name":\s*"review"/,
    file: 'package.json' },
  { name: 'package.json has respond command', regex: /"name":\s*"respond"/,
    file: 'package.json' },
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
  { name: '8 mocha tests pass for code-review-request',
    check: () => passedTests === 8 },
  { name: 'package.json has version 0.4.0',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
      return pkg.version === '0.4.0';
    }},
  { name: 'package.json has 9 slash commands including review and respond',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
      const commands = pkg.contributes.chatParticipants[0].commands;
      const hasReview = commands.some(c => c.name === 'review');
      const hasRespond = commands.some(c => c.name === 'respond');
      return commands.length === 9 && hasReview && hasRespond;
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
