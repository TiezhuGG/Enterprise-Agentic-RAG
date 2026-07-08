'use client';

interface DemoQuestionBankProps {
  disabled?: boolean;
  onSelect: (question: string) => void;
}

const demoQuestions = [
  '单笔超过10000元的报销需要谁审批？',
  '知识空间中 OWNER、EDITOR、VIEWER 分别能做什么？',
  '如果报销材料不完整，财务部应该如何处理？',
];

export function DemoQuestionBank({ disabled = false, onSelect }: DemoQuestionBankProps) {
  return (
    <section className="workbench-panel demo-question-bank">
      <div className="workbench-panel__header">
        <div>
          <h2>Demo Questions</h2>
          <span>sample-policy.md</span>
        </div>
      </div>

      <div className="demo-question-bank__list">
        {demoQuestions.map((question) => (
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
