import type { ExecutionContext } from '../../common';
import type { ChatRequestDto, ChatResponse } from '../chat/chat.types';
import type { AgentState } from './graph/agent.state';

export interface AgentRunInput {
  conversationId: string;
  context: ExecutionContext;
  input: ChatRequestDto;
}

export interface AgentRunResult extends ChatResponse {
  verified: boolean;
}

export interface PlannerDecision {
  needsGraph: boolean;
  needsRetrieval: boolean;
}

export interface AgentNode {
  run(state: AgentState): Promise<AgentState>;
}

export interface AgentWorkflowTrace {
  iterations: number;
  visitedNodes: string[];
}
