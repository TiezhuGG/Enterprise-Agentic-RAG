'use client';

interface AgentQuestionBankProps {
  disabled?: boolean;
  onSelect: (question: string) => void;
}

const suggestedQuestions = [
  '单笔超过 10000 元的报销需要谁审批？',
  '知识空间里的 OWNER、EDITOR、VIEWER 分别能做什么？',
  '如果报销材料不完整，财务部门应该如何处理？',
];

export function AgentQuestionBank({ disabled = false, onSelect }: AgentQuestionBankProps) {
  return (
    <section className="workbench-panel demo-question-bank">
      <div className="workbench-panel__header">
        <div>
          <h2>示例问题</h2>
          <span>用于快速验证问答链路</span>
        </div>
      </div>

      <div className="demo-question-bank__list">
        {suggestedQuestions.map((question) => (
          <button
            className="demo-question-bank__item"
            disabled={disabled}
            key={question}
            onClick={() => onSelect(question)}
            type="button"
          >
            {question}
          </button>
        ))}
      </div>
    </section>
  );
}
