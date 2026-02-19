// Manual test of debugging skill logic without vscode dependency
const fs = require('fs');
const path = require('path');

// Read the source file and extract the key parts
const source = fs.readFileSync(path.join(__dirname, 'src/skills/debugging.ts'), 'utf8');

// Check if all required elements are present
console.log('=== Checking debugging.ts Implementation ===\n');

const checks = [
  { name: 'ID is "debug"', regex: /id:\s*'debug'/, found: false },
  { name: 'Keywords include debug, bug, 调试', regex: /keywords:.*\[.*'debug'.*'bug'.*'调试'/, found: false },
  { name: 'IRON LAW present', regex: /NO FIXES WITHOUT ROOT CAUSE INVESTIGATION/, found: false },
  { name: '4 phases defined', regex: /Phase:.*ROOT-CAUSE.*Phase:.*PATTERN.*Phase:.*HYPOTHESIS.*Phase:.*IMPLEMENT/s, found: false },
  { name: 'root-cause to pattern transition', regex: /'root-cause':\s*\{[\s\S]*?next:\s*'pattern'/, found: false },
  { name: 'pattern to hypothesis transition', regex: /pattern:\s*\{[\s\S]*?next:\s*'hypothesis'/, found: false },
  { name: 'hypothesis to implement transition', regex: /hypothesis:\s*\{[\s\S]*?next:\s*'implement'/, found: false },
  { name: '3-fix architecture check', regex: /Attempts >= 3.*architecture/s, found: false },
  { name: 'one variable at a time', regex: /one variable at a time/, found: false },
  { name: 'failing test before fix', regex: /failing test.*first/, found: false },
  { name: 'detectPhase method', regex: /detectPhase\(response:\s*string/, found: false },
  { name: 'handle method', regex: /async handle\(ctx:\s*SkillContext\)/, found: false },
  { name: 'git context gathering', regex: /git\.status|git\.log|git\.diff/, found: false },
  { name: 'fixAttempts tracking', regex: /fixAttempts/, found: false }
];

checks.forEach(check => {
  check.found = check.regex.test(source);
  console.log(`${check.found ? '✓' : '✗'} ${check.name}`);
});

const allPassed = checks.every(c => c.found);
console.log(`\n${allPassed ? '✓' : '✗'} All checks ${allPassed ? 'PASSED' : 'FAILED'}`);

process.exit(allPassed ? 0 : 1);
