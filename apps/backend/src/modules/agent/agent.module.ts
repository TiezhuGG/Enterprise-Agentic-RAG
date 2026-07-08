import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config';
import { ConversationModule } from '../conversation';
import { KnowledgeGraphModule } from '../knowledge-graph';
import { MemoryModule } from '../memory';
import { RetrievalModule } from '../retrieval';
import { LLM_PROVIDER } from '../chat/providers/llm.provider';
import { OpenAiCompatibleLlmProvider } from '../chat/providers/openai-compatible.provider';
import { PromptBuilder } from '../chat/prompt/prompt.builder';
import { AgentService } from './agent.service';
import { AgentGraph } from './graph/agent.graph';
import { AnswerNode } from './nodes/answer.node';
import { GraphNode } from './nodes/graph.node';
import { MemoryNode } from './nodes/memory.node';
import { PlannerNode } from './nodes/planner.node';
import { RetrievalNode } from './nodes/retrieval.node';
import { VerificationNode } from './nodes/verification.node';
import { GraphTool } from './tools/graph.tool';
import { MemoryTool } from './tools/memory.tool';
import { RetrievalTool } from './tools/retrieval.tool';

@Module({
  imports: [ConfigModule, ConversationModule, KnowledgeGraphModule, MemoryModule, RetrievalModule],
  providers: [
    AgentGraph,
    AgentService,
    AnswerNode,
    GraphNode,
    GraphTool,
    MemoryNode,
    MemoryTool,
    PlannerNode,
    PromptBuilder,
    RetrievalNode,
    RetrievalTool,
    VerificationNode,
    {
      provide: LLM_PROVIDER,
      useClass: OpenAiCompatibleLlmProvider,
    },
  ],
  exports: [AgentService],
})
export class AgentModule {}
