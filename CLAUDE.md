# powerfull_copolit

## Project Overview

<!-- Describe your project here -->

## Tech Stack

<!-- List key technologies -->

## Development Guidelines

- Write tests for new features
- Keep commits focused and descriptive
- Follow existing code patterns and conventions

## Directory Structure

<!-- Document important directories -->

## Legion

This project uses **Legion** for multi-agent orchestration with Claude Code.

### Squad Mode

- **Leader** — analyzes tasks, splits into tickets, dispatches to workers
- **Workers** — execute tickets independently in isolated git worktrees

### Available Tools

| Command | Description |
|---------|-------------|
| `/split-tickets` | Leader command: analyze task, create tickets, dispatch to workers |
| `legion-dispatch <worker> -t "title" -c "ctx" -k "criteria" "prompt"` | Dispatch a ticket to a worker |
| `legion-status` | Check worker status and ticket queue |
| `legion-check <ticket_id>` | Review a completed ticket's diff |
| `legion-report` | Get a summary report of all tickets |

### Workflow

1. Leader uses `/split-tickets` to decompose a task into independent tickets
2. Each ticket is dispatched to an available worker with `legion-dispatch`
3. Workers execute in isolated worktrees (no file conflicts)
4. Leader reviews with `legion-check` and merges completed work
