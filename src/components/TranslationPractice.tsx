import type { Word } from "../types";
import { SentenceBySentencePractice } from "./SentenceBySentencePractice";

export function TranslationPractice({
  words,
  setWords
}: {
  words: Word[];
  setWords: (words: Word[]) => void;
}) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-hidden">
      <SentenceBySentencePractice words={words} setWords={setWords} />
    </div>
  );
}
