import type { AssistantMessage as Message } from '../conversation';
import { AssistantBubble } from './assistant-bubble';
import { CrisisCard } from './crisis-card';
import { NoMatchLinks } from './no-match-links';
import { QuestionOptions } from './question-options';
import { ResultMessage } from './result-message';

/** 답 종류에 따라 말풍선 아래에 선택지·결과·안내를 붙인다. 선택지와 이어 하기 동작은 마지막 답에만 둔다. */
export function AssistantMessage({
  message,
  isActive,
  onAnswer,
  onAskMore,
  onRestart,
}: {
  message: Message;
  /** 마지막 답이고 아직 이어서 말할 수 있을 때. */
  isActive: boolean;
  onAnswer: (text: string) => void;
  onAskMore: () => void;
  onRestart: () => void;
}) {
  if (message.kind === 'result' && message.items.length > 0) {
    return (
      <ResultMessage
        message={message}
        isActive={isActive}
        onAskMore={onAskMore}
        onRestart={onRestart}
      />
    );
  }
  const hasQuestions =
    isActive && message.kind === 'question' && message.questions.length > 0;
  return (
    <AssistantBubble text={message.text}>
      {hasQuestions && (
        <QuestionOptions questions={message.questions} onAnswer={onAnswer} />
      )}
      {message.kind === 'no_match' && isActive && <NoMatchLinks />}
      {message.kind === 'self_harm' && <CrisisCard />}
    </AssistantBubble>
  );
}
