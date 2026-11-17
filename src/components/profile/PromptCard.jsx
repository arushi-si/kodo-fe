// Hinge-style prompt: the question as a code comment, the answer in large type.
function PromptCard({ prompt, className = "", children }) {
  return (
    <section className={`rounded-3xl bg-base-200 border border-white/5 p-6 ${className}`}>
      <p className="font-mono text-[13px] text-muted">{`// ${prompt.question}`}</p>
      <p className="mt-3 font-display text-2xl leading-snug font-semibold whitespace-pre-line break-words">
        {prompt.answer}
      </p>
      {children}
    </section>
  );
}

export default PromptCard;
