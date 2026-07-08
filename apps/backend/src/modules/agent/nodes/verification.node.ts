import { Injectable } from '@nestjs/common';
import type { AgentNode } from '../agent.types';
import type { AgentState } from '../graph/agent.state';

@Injectable()
export class VerificationNode implements AgentNode {
  async run(state: AgentState): Promise<AgentState> {
    return {
      ...state,
      verified: Boolean(state.answer?.trim()),
    };
  }
}
