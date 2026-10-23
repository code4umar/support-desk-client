// Shows a comment's text and highlights "@Full Name" tags (an @ followed by up to three capitalised words).
const MENTION = /((?<![\p{L}\p{N}._%+-])@\p{Lu}[\p{L}.'’-]*(?:\s+\p{Lu}[\p{L}.'’-]*){0,2})/gu;

export default function MentionText({ body }: { body: string }) {
  const parts = body.split(MENTION); // tags land on the odd positions
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="rounded bg-brand/15 px-1 font-medium text-brand-dark">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
