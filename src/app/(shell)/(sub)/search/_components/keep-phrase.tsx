/** "물리치료·재활"처럼 가운뎃점으로 이은 말이 점에서 줄바꿈되지 않게 한다. 띄어쓰기에서는 그대로 줄바꿈된다. */
export function KeepPhrase({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((part, index) =>
        part.includes('·') ? (
          <span key={index} className="whitespace-nowrap">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
