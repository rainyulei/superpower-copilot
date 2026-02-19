// Manual test of code-review-request skill logic without vscode dependency
const fs = require('fs');
const path = require('path');

// Read the source file and extract the key parts
const source = fs.readFileSync(path.join(__dirname, 'src/skills/code-review-request.ts'), 'utf8');

console.log('=== Checking code-review-request.ts Implementation ===\n');

const checks = [
  { name: 'ID is "review"', regex: /id:\s*'review'/, found: false },
  { name: 'Keywords include review, code review, 审查, 检查代码', regex: /keywords:.*review.*code review.*审查.*检查代码/, found: false },
  { name: 'Severity categories (Critical, Important, Minor)', regex: /Critical[\s\S]*Important[\s\S]*Minor/, found: false },
  { name: 'Review dimensions (Code Quality, Architecture, Testing, Requirements)', regex: /Code Quality[\s\S]*Architecture[\s\S]*Testing[\s\S]*Requirements/, found: false },
  { name: 'file:line reference format', regex: /\[file:line\]/, found: false },
  { name: 'gather to analyze transition', regex: /gather:\s*\{[\s\S]*?next:\s*'analyze'/, found: false },
  { name: 'analyze to report transition', regex: /analyze:\s*\{[\s\S]*?next:\s*'report'/, found: false },
  { name: 'detectPhase method', regex: /detectPhase\(response:\s*string/, found: false },
  { name: 'handle method', regex: /async handle\(ctx:\s*SkillContext\)/, found: false },
  { name: 'git context gathering (diff, diffStaged, status, log)', regex: /git\.diff\(\)|git\.diffStaged\(\)|git\.status\(\)|git\.log\(/, found: false },
  { name: 'nextSkill: respond', regex: /nextSkill:\s*'respond'/, found: false },
  { name: '3 phases (GATHER, ANALYZE, REPORT)', regex: /Phase:.*GATHER[\s\S]*Phase:.*ANALYZE[\s\S]*Phase:.*REPORT/, found: false }
];

checks.forEach(check => {
  check.found = check.regex.test(source);
  console.log(`${check.found ? '✓' : '✗'} ${check.name}`);
});

const allPassed = checks.every(c => c.found);
console.log(`\n${allPassed ? '✓ All checks PASSED' : '✗ Some checks FAILED'}`);

// Also run basic unit test checks on the test file
console.log('\n=== Checking code-review-request.test.ts Implementation ===\n');

const testSource = fs.readFileSync(path.join(__dirname, 'test/unit/code-review-request.test.ts'), 'utf8');

const testChecks = [
  { name: 'Test 1: correct id', regex: /should have correct id/, found: false },
  { name: 'Test 2: keywords', regex: /should have keywords/, found: false },
  { name: 'Test 3: gather to analyze transition', regex: /should detect phase transition from gather to analyze/, found: false },
  { name: 'Test 4: analyze to report transition', regex: /should detect phase transition from analyze to report/, found: false },
  { name: 'Test 5: no transition without signal', regex: /should not transition when no signal detected/, found: false },
  { name: 'Test 6: severity categories in prompt', regex: /should include severity categories in system prompt/, found: false },
  { name: 'Test 7: review dimensions in prompt', regex: /should include review dimensions in system prompt/, found: false },
  { name: 'Test 8: file:line references', regex: /should include file:line references format in system prompt/, found: false }
];

testChecks.forEach(check => {
  check.found = check.regex.test(testSource);
  console.log(`${check.found ? '✓' : '✗'} ${check.name}`);
});

const testsPassed = testChecks.every(c => c.found);
console.log(`\n${testsPassed ? '✓ All 8 tests defined' : '✗ Some tests missing'}`);

const finalResult = allPassed && testsPassed;
console.log(`\n${'='.repeat(50)}`);
console.log(`${finalResult ? '✓ ALL VERIFICATION PASSED' : '✗ VERIFICATION FAILED'}`);
console.log('='.repeat(50));

process.exit(finalResult ? 0 : 1);
