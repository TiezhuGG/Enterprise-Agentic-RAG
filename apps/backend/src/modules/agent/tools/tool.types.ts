export type AgentToolName = 'graph' | 'memory' | 'retrieval';

export interface AgentTool<TInput = unknown, TOutput = unknown> {
  readonly description: string;
  readonly name: AgentToolName;
  invoke(input: TInput): Promise<TOutput>;
}

export interface AgentToolDescriptor {
  description: string;
  name: AgentToolName;
}
