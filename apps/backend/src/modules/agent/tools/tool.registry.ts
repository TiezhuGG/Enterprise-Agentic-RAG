import { Injectable } from '@nestjs/common';
import { GraphTool } from './graph.tool';
import { MemoryTool } from './memory.tool';
import { RetrievalTool } from './retrieval.tool';
import type { AgentTool, AgentToolDescriptor, AgentToolName } from './tool.types';

@Injectable()
export class ToolRegistry {
  private readonly tools: Map<AgentToolName, AgentTool>;

  constructor(graphTool: GraphTool, memoryTool: MemoryTool, retrievalTool: RetrievalTool) {
    this.tools = new Map<AgentToolName, AgentTool>(
      [graphTool, memoryTool, retrievalTool].map((tool) => [tool.name, tool]),
    );
  }

  get<TTool extends AgentTool = AgentTool>(name: AgentToolName): TTool {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Agent tool not registered: ${name}`);
    }

    return tool as TTool;
  }

  list(): AgentToolDescriptor[] {
    return [...this.tools.values()].map((tool) => ({
      description: tool.description,
      name: tool.name,
    }));
  }
}
