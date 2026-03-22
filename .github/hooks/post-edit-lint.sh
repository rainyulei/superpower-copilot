#!/bin/bash
# BitFrog v5 — PostToolUse hook for bitfrog-execute agent
# Runs lint after file edit operations. Skips for other tools.
# Lint failure injects warning context but does NOT block the agent.

# Graceful degradation if jq is not installed
if ! command -v jq &>/dev/null; then echo '{"continue":true}'; exit 0; fi

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

case "$TOOL_NAME" in
  editFiles|createFile)
    # Check if project has a lint script
    if [ -f "package.json" ] && grep -q '"lint"' package.json; then
      LINT_FULL=$(npm run lint 2>&1)
      LINT_EXIT=$?
      LINT_OUTPUT=$(echo "$LINT_FULL" | tail -20)
      if [ $LINT_EXIT -ne 0 ]; then
        jq -n --arg reason "$LINT_OUTPUT" '{
          continue: true,
          hookSpecificOutput: {
            additionalContext: ("⚠️ Lint issues found after edit:\n```\n" + $reason + "\n```\nFix these before proceeding.")
          }
        }'
        exit 0
      fi
    fi
    ;;
esac

# Other tools or lint passed — continue normally
jq -n '{continue: true}'
