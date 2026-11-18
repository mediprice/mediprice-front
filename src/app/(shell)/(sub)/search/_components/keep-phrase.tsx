/** "물리치료·재활"처럼 가운뎃점으로 이은 말을 한 덩어리로 둔다. 띄어쓰기에서는 줄바꿈되고, 덩어리가 줄보다 길면(큰 글자) 그때만 쪼갠다. */
export function KeepPhrase({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((part, index) =>
        part.includes('·') ? (
          <span key={index} className="wrap-anywhere break-keep">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
