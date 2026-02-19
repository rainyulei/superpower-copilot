// Manual test of debugging test file
const fs = require('fs');
const path = require('path');

// Read the test file
const source = fs.readFileSync(path.join(__dirname, 'test/unit/debugging.test.ts'), 'utf8');

console.log('=== Checking debugging.test.ts ===\n');

const checks = [
  { name: 'Test 1: should have correct id', regex: /test\('should have correct id'/, found: false },
  { name: 'Test 2: should have keywords for routing', regex: /test\('should have keywords for routing'/, found: false },
  { name: 'Test 3: phase transition root-cause to pattern', regex: /test\('should detect phase transition from root-cause to pattern'/, found: false },
  { name: 'Test 4: phase transition pattern to hypothesis', regex: /test\('should detect phase transition from pattern to hypothesis'/, found: false },
  { name: 'Test 5: phase transition hypothesis to implement', regex: /test\('should detect phase transition from hypothesis to implement'/, found: false },
  { name: 'Test 6: should not transition without signal', regex: /test\('should not transition without signal'/, found: false },
  { name: 'Test 7: enforce Iron Law in system prompt', regex: /test\('should enforce Iron Law in system prompt'/, found: false },
  { name: 'Test 8: enforce 3-fix architectural stop', regex: /test\('should enforce 3-fix architectural stop in system prompt'/, found: false },
  { name: 'Test 9: enforce one-variable-at-a-time', regex: /test\('should enforce one-variable-at-a-time in system prompt'/, found: false },
  { name: 'Test 10: enforce failing test before fix', regex: /test\('should enforce failing test before fix in system prompt'/, found: false },
];

checks.forEach(check => {
  check.found = check.regex.test(source);
  console.log(`${check.found ? '✓' : '✗'} ${check.name}`);
});

const allPassed = checks.every(c => c.found);
console.log(`\n${allPassed ? '✓' : '✗'} All 10 tests ${allPassed ? 'PRESENT' : 'MISSING'}`);

// Verify test imports
const hasImport = /import.*debuggingSkill.*from.*debugging/.test(source);
console.log(`${hasImport ? '✓' : '✗'} Import statement present`);

process.exit(allPassed && hasImport ? 0 : 1);
