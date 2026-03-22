#!/bin/bash
# BitFrog v5 — SessionStart / SubagentStart hook
# Injects bitfrog-philosophy.md as additionalContext via jq.
# Skips injection for dedicated sub-agents (spec-reviewer, code-reviewer, task-worker).

# Graceful degradation if jq is not installed
if ! command -v jq &>/dev/null; then echo '{"continue":true}'; exit 0; fi

INPUT=$(cat)

# Resolve script directory to find philosophy file
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PHILOSOPHY_FILE="$SCRIPT_DIR/../agents/bitfrog-philosophy.md"

if [ ! -f "$PHILOSOPHY_FILE" ]; then
  jq -n '{continue: true}'
  exit 0
fi

PHILOSOPHY=$(cat "$PHILOSOPHY_FILE")

# Check if SubagentStart — skip dedicated sub-agents
HOOK_EVENT=$(echo "$INPUT" | jq -r '.hookEventName // empty')
AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // empty')

if [ "$HOOK_EVENT" = "SubagentStart" ]; then
  case "$AGENT_TYPE" in
    *spec-reviewer*|*code-reviewer*|*task-worker*)
      jq -n '{continue: true}'
      exit 0
      ;;
  esac
fi

# Inject philosophy as additionalContext
jq -n --arg phil "$PHILOSOPHY" '{
  continue: true,
  hookSpecificOutput: {
    additionalContext: ("## BitFrog Thinking Principles (Auto-injected)\n\n" + $phil)
  }
}'
