// src/participant.ts
import * as vscode from 'vscode';
import { SkillRegistry } from './skills/registry';
import { SkillRouter } from './router';
import { SkillContext, Skill, SkillResult } from './skills/types';
import { SessionStateImpl } from './state/session';
import { createToolKit } from './tools/index';
import { brainstormingSkill } from './skills/brainstorming';
import { writingPlansSkill } from './skills/writing-plans';
import { executingPlansSkill } from './skills/executing-plans';
import { verificationSkill } from './skills/verification';
import { finishBranchSkill } from './skills/finish-branch';
import { tddSkill } from './skills/tdd';
import { debuggingSkill } from './skills/debugging';
import { codeReviewRequestSkill } from './skills/code-review-request';
import { codeReviewReceiveSkill } from './skills/code-review-receive';
import { getWelcomeMessage, getHelpMessage } from './welcome';

export class SuperpowerParticipant {
  private registry: SkillRegistry;
  private router: SkillRouter;
  private toolkit = createToolKit();

  constructor(private context: vscode.ExtensionContext) {
    this.registry = new SkillRegistry();
    this.router = new SkillRouter(this.registry);

    // Register skills
    this.registry.register(brainstormingSkill);
    this.registry.register(writingPlansSkill);
    this.registry.register(executingPlansSkill);
    this.registry.register(verificationSkill);
    this.registry.register(finishBranchSkill);
    this.registry.register(tddSkill);
    this.registry.register(debuggingSkill);
    this.registry.register(codeReviewRequestSkill);
    this.registry.register(codeReviewReceiveSkill);
  }

  handler: vscode.ChatRequestHandler = async (
    request, chatContext, stream, token
  ) => {
    // 1. Restore session
    const session = this.restoreSession(chatContext);

    // 2. Handle help command
    if (request.command === 'help') {
      stream.markdown(getHelpMessage());
      return {};
    }

    // 3. Handle empty first message
    if (!request.command && !request.prompt.trim()) {
      stream.markdown(getWelcomeMessage());
      return {};
    }

    // 4. Determine skill
    let skill: Skill;

    if (request.command) {
      const matched = this.registry.get(request.command);
      if (!matched) {
        stream.markdown(`Unknown command: /${request.command}. Available: ${this.registry.all().map(s => '/' + s.id).join(', ')}`);
        return {};
      }
      skill = matched;
    } else {
      const activeSkillId = session.get<string>('activeSkillId');
      const isFollowUp = this.isFollowUpTurn(chatContext);

      if (activeSkillId && isFollowUp) {
        skill = this.registry.get(activeSkillId) ?? await this.router.route(request.prompt, request.model, token);
      } else {
        skill = await this.router.route(request.prompt, request.model, token);
        stream.progress(`Using ${skill.name}...`);
      }
    }

    // 5. Activate session
    session.activate(skill.id);
    session.set('activeSkillId', skill.id);

    // 6. Execute skill
    const ctx: SkillContext = {
      request, chatContext, stream, token,
      model: request.model,
      session,
      tools: this.toolkit,
    };

    let result: SkillResult;
    try {
      result = await skill.handle(ctx);
    } catch (err) {
      stream.markdown(`\n\n⚠️ Error in ${skill.name}: ${err instanceof Error ? err.message : String(err)}`);
      return { metadata: { error: true } };
    }

    // 7. Persist session
    this.context.workspaceState.update(
      'superpower.session',
      session.serialize()
    );

    // 8. Handle skill chaining
    if (result.nextSkill && result.metadata) {
      const nextSkill = this.registry.get(result.nextSkill);
      if (nextSkill) {
        session.transfer(skill.id, nextSkill.id, 'handoff');
      }
    }

    // 9. Return result with skillId in metadata for followup provider
    return {
      ...result,
      metadata: {
        ...result.metadata,
        skillId: skill.id,
      },
    };
  };

  private restoreSession(_chatContext: vscode.ChatContext): SessionStateImpl {
    // Try to restore from workspaceState
    const persisted = this.context.workspaceState.get<Record<string, unknown>>('superpower.session');
    if (persisted) {
      return SessionStateImpl.fromSerialized(persisted);
    }
    return new SessionStateImpl();
  }

  private isFollowUpTurn(chatContext: vscode.ChatContext): boolean {
    const lastResponse = chatContext.history
      .filter((h): h is vscode.ChatResponseTurn => h instanceof vscode.ChatResponseTurn)
      .at(-1);

    if (!lastResponse) return false;
    const meta = lastResponse.result as Record<string, unknown> | undefined;
    return meta?.metadata != null && !(meta.metadata as Record<string, unknown>)?.error;
  }
}
