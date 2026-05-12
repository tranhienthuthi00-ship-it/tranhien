import React, { useState } from "react";
import { Plus, Check, Info, BookOpen } from "lucide-react";
import type { Word } from "@/types";
import { cn } from "@/lib/utils";

interface CEFRWord {
  vocabulary: string;
  wordType: string;
  ipa: string;
  definition: string;
  example: string;
}

const CEFR_DATA: Record<string, CEFRWord[]> = {
  "A1": [
    { vocabulary: "Always", wordType: "adv", ipa: "/ˈɔːlweɪz/", definition: "At all times; on all occasions.", example: "I always brush my teeth before bed." },
    { vocabulary: "Family", wordType: "noun", ipa: "/ˈfæməli/", definition: "A group of one or more parents and their children living together as a unit.", example: "I love spending time with my family." },
    { vocabulary: "Friend", wordType: "noun", ipa: "/frend/", definition: "A person whom one knows and with whom one has a bond of mutual affection.", example: "Sarah is my best friend." },
    { vocabulary: "Happy", wordType: "adj", ipa: "/ˈhæpi/", definition: "Feeling or showing pleasure or contentment.", example: "The children look very happy today." },
    { vocabulary: "Learn", wordType: "verb", ipa: "/lɜːrn/", definition: "Gain or acquire knowledge of or skill in (something) by study, experience, or being taught.", example: "I am learning English." },
    { vocabulary: "School", wordType: "noun", ipa: "/skuːl/", definition: "An institution for educating children.", example: "He goes to school every morning." },
    { vocabulary: "Water", wordType: "noun", ipa: "/ˈwɔːtər/", definition: "A colorless, transparent, odorless liquid that forms the seas, lakes, rivers, and rain.", example: "Please drink plenty of water." },
    { vocabulary: "Work", wordType: "verb", ipa: "/wɜːrk/", definition: "Be engaged in physical or mental effort in order to achieve a purpose or result.", example: "She works at a hospital." },
  ],
  "A2": [
    { vocabulary: "Advice", wordType: "noun", ipa: "/ədˈvaɪs/", definition: "Guidance or recommendations offered with regard to prudent future action.", example: "I need some advice on which car to buy." },
    { vocabulary: "Believe", wordType: "verb", ipa: "/bɪˈliːv/", definition: "Accept (something) as true; feel sure of the truth of.", example: "I believe everything happen for a reason." },
    { vocabulary: "Comfortable", wordType: "adj", ipa: "/ˈkʌmftəbl/", definition: "(especially of clothes or furnishings) providing physical ease and relaxation.", example: "This sofa is very comfortable." },
    { vocabulary: "Decision", wordType: "noun", ipa: "/dɪˈsɪʒn/", definition: "A conclusion or resolution reached after consideration.", example: "I haven't made a decision yet." },
    { vocabulary: "Experience", wordType: "noun", ipa: "/ɪkˈspɪəriəns/", definition: "Practical contact with and observation of facts or events.", example: "I have five years of experience in marketing." },
    { vocabulary: "Healthy", wordType: "adj", ipa: "/ˈhelθi/", definition: "In good health.", example: "Eating vegetables is part of a healthy diet." },
    { vocabulary: "Modern", wordType: "adj", ipa: "/ˈmɒdn/", definition: "Relating to the present or recent times as opposed to the remote past.", example: "I like living in a modern apartment." },
    { vocabulary: "Possible", wordType: "adj", ipa: "/ˈpɒsəbl/", definition: "Able to be done or achieved to happen.", example: "Is it possible to finish this by Friday?" },
  ],
  "B1": [
    { vocabulary: "Achievement", wordType: "noun", ipa: "/əˈtʃiːvmənt/", definition: "A thing done successfully, typically by effort, courage, or skill.", example: "The new bridge is a great engineering achievement." },
    { vocabulary: "Challenge", wordType: "noun", ipa: "/ˈtʃælɪndʒ/", definition: "A task or situation that tests someone's abilities.", example: "Climbing Mount Everest was a huge challenge." },
    { vocabulary: "Description", wordType: "noun", ipa: "/dɪˈskrɪpʃn/", definition: "A spoken or written representation or account of a person, object, or event.", example: "Can you give me a description of the thief?" },
    { vocabulary: "Education", wordType: "noun", ipa: "/ˌedʒuˈkeɪʃn/", definition: "The process of receiving or giving systematic instruction.", example: "Education is the key to success." },
    { vocabulary: "Furniture", wordType: "noun", ipa: "/ˈfɜːrnɪtʃər/", definition: "The movable articles that are used to make a room or building suitable for living or working in.", example: "The room was empty of furniture." },
    { vocabulary: "Identify", wordType: "verb", ipa: "/aɪˈdentɪfaɪ/", definition: "Establish or indicate who or what (someone or something) is.", example: "Can you identify your luggage?" },
    { vocabulary: "Option", wordType: "noun", ipa: "/ˈɒpʃn/", definition: "A thing that is or may be chosen.", example: "We have several options for dinner." },
    { vocabulary: "Situation", wordType: "noun", ipa: "/ˌsɪtʃuˈeɪʃn/", definition: "A set of circumstances in which one finds oneself.", example: "I find myself in a difficult situation." },
  ],
  "B2": [
    { vocabulary: "Alternative", wordType: "adj", ipa: "/ɔːlˈtɜːrnətɪv/", definition: "(of one or more things) available as another possibility.", example: "We have an alternative plan if it rains." },
    { vocabulary: "Consequence", wordType: "noun", ipa: "/ˈkɒnsɪkwəns/", definition: "A result or effect of an action or condition.", example: "The increase in temperature is a consequence of global warming." },
    { vocabulary: "Essentially", wordType: "adv", ipa: "/ɪˈsenʃəli/", definition: "Used to emphasize the basic, fundamental, or primary nature of something.", example: "Essentially, they are asking for more money." },
    { vocabulary: "Hypothesis", wordType: "noun", ipa: "/haɪˈpɒθəsɪs/", definition: "A supposition or proposed explanation made on the basis of limited evidence.", example: "The scientists set out to test their hypothesis." },
    { vocabulary: "Innocent", wordType: "adj", ipa: "/ˈɪnəsnt/", definition: "Not guilty of a crime or offense.", example: "The man was found innocent of all charges." },
    { vocabulary: "Persuade", wordType: "verb", ipa: "/pəˈsweɪd/", definition: "Cause (someone) to do something through reasoning or argument.", example: "I managed to persuade him to come with us." },
    { vocabulary: "Relevant", wordType: "adj", ipa: "/ˈreləvənt/", definition: "Closely connected or appropriate to what is being done or considered.", example: "The comments were not relevant to the discussion." },
    { vocabulary: "Variation", wordType: "noun", ipa: "/ˌveəriˈeɪʃn/", definition: "A change or difference in condition, amount, or level.", example: "The dictionary lists several variations of the word." },
  ],
  "C1": [
    { vocabulary: "Ambiguous", wordType: "adj", ipa: "/æmˈbɪɡjuəs/", definition: "Open to more than one interpretation; having a double meaning.", example: "The contract's wording was ambiguous." },
    { vocabulary: "Comprehensive", wordType: "adj", ipa: "/ˌkɒmprɪˈhensɪv/", definition: "Complete; including all or nearly all elements or aspects of something.", example: "The report offers a comprehensive look at the issue." },
    { vocabulary: "Diligent", wordType: "adj", ipa: "/ˈdɪlɪdʒənt/", definition: "Having or showing care and conscientiousness in one's work or duties.", example: "She is a diligent worker who always finishes her tasks on time." },
    { vocabulary: "Eloquent", wordType: "adj", ipa: "/ˈeləkwənt/", definition: "Fluent or persuasive in speaking or writing.", example: "He gave an eloquent speech about human rights." },
    { vocabulary: "Inevitably", wordType: "adv", ipa: "/ɪnˈevɪtəbli/", definition: "As is certain to happen; unavoidably.", example: "Growing old inevitably brings changes." },
    { vocabulary: "Meticulous", wordType: "adj", ipa: "/məˈtɪkjələs/", definition: "Showing great attention to detail; very careful and precise.", example: "The researcher was meticulous in her documentation." },
    { vocabulary: "Prosperity", wordType: "noun", ipa: "/prɒˈsperəti/", definition: "The state of being prosperous (successful and wealthy).", example: "The country experienced a period of peace and prosperity." },
    { vocabulary: "Sustainable", wordType: "adj", ipa: "/səˈsteɪnəbl/", definition: "Able to be maintained at a certain rate or level.", example: "The government is promoting sustainable economic growth." },
  ],
  "C2": [
    { vocabulary: "Aesthetic", wordType: "adj", ipa: "/esˈθetɪk/", definition: "Concerned with beauty or the appreciation of beauty.", example: "The pictures give great aesthetic pleasure." },
    { vocabulary: "Benevolent", wordType: "adj", ipa: "/bəˈnevələnt/", definition: "Well meaning and kindly.", example: "He was a benevolent old man, adored by all his neighbors." },
    { vocabulary: "Capricious", wordType: "adj", ipa: "/kəˈprɪʃəs/", definition: "Given to sudden and unaccountable changes of mood or behavior.", example: "A capricious and often brutal administration." },
    { vocabulary: "Ephemeral", wordType: "adj", ipa: "/ɪˈfemərəl/", definition: "Lasting for a very short time.", example: "Fashions are ephemeral." },
    { vocabulary: "Resilience", wordType: "noun", ipa: "/rɪˈzɪliəns/", definition: "The capacity to recover quickly from difficulties; toughness.", example: "The resilience of the economy has come as a surprise to some." },
    { vocabulary: "Ubiquitous", wordType: "adj", ipa: "/juːˈbɪkwɪtəs/", definition: "Present, appearing, or found everywhere.", example: "His puffy face was ubiquitous on television." },
  ],
};

export function CEFRVocabulary({
  words,
  setWords
}: {
  words: Word[];
  setWords: (words: Word[]) => void;
}) {
  const [activeLevel, setActiveLevel] = useState("A1");

  const addWord = (w: CEFRWord) => {
    // Check if already in bank
    if (words.some(existing => existing.vocabulary.toLowerCase() === w.vocabulary.toLowerCase())) {
      return;
    }

    const newWord: Word = {
      id: `cefr-${Date.now()}-${w.vocabulary}`,
      vocabulary: w.vocabulary,
      wordType: w.wordType,
      ipa: w.ipa,
      definition: w.definition,
      examples: [w.example],
      tags: ["CEFR", activeLevel],
      difficulty: 0,
      lastReviewed: new Date().toISOString(),
      nextReview: new Date(Date.now() + 86400000).toISOString(),
    };

    setWords([newWord, ...words]);
  };

  const isWordInBank = (v: string) => words.some(w => w.vocabulary.toLowerCase() === v.toLowerCase());

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2 flex-wrap mb-6">
        {Object.keys(CEFR_DATA).map(level => (
          <button
            key={level}
            onClick={() => setActiveLevel(level)}
            className={cn(
              "px-4 py-2 rounded-lg font-bold text-sm tracking-widest transition-all sketch-border",
              activeLevel === level 
                ? "bg-crimson text-white border-crimson shadow-md scale-105" 
                : "bg-white text-ink/60 border-ink/10 hover:border-ink/30"
            )}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="bg-ink/5 p-4 rounded-xl sketch-border border-dashed mb-6 flex items-start gap-3">
        <Info className="text-crimson shrink-0 mt-1" size={18} />
        <div className="text-xs leading-relaxed text-ink/70">
          <p className="font-bold text-ink mb-1">Cấp độ {activeLevel}:</p>
          {activeLevel === "A1" && "Dành cho người mới bắt đầu. Tập trung vào các từ vựng cơ bản nhất để giao tiếp đơn giản."}
          {activeLevel === "A2" && "Tiền trung cấp. Các từ vựng mô tả gia đình, công việc, mua sắm và môi trường xung quanh."}
          {activeLevel === "B1" && "Trung cấp. Có khả năng hiểu các điểm chính của các chủ đề quen thuộc trong công việc, trường học."}
          {activeLevel === "B2" && "Hậu trung cấp. Có khả năng hiểu các ý chính của các văn bản phức tạp về các chủ đề cụ thể hoặc trừu tượng."}
          {activeLevel === "C1" && "Cao cấp. Có khả năng hiểu các văn bản dài và khó, nhận biết được các ý nghĩa tiềm ẩn."}
          {activeLevel === "C2" && "Thông thạo. Có khả năng hiểu một cách dễ dàng hầu hết mọi văn bản đọc hoặc nghe."}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CEFR_DATA[activeLevel].map((word) => (
          <div key={word.vocabulary} className="bg-white p-4 sketch-border shadow-sm group hover:shadow-md transition-all relative">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-xl font-bold text-ink">{word.vocabulary}</h4>
                <div className="flex gap-2 items-center text-[10px] uppercase font-bold text-ink/40 tracking-widest">
                  <span className="bg-ink/5 px-1.5 py-0.5 rounded italic">{word.wordType}</span>
                  <span>{word.ipa}</span>
                </div>
              </div>
              <button
                onClick={() => addWord(word)}
                disabled={isWordInBank(word.vocabulary)}
                className={cn(
                  "p-2 rounded-full transition-all border-2",
                  isWordInBank(word.vocabulary)
                    ? "bg-green-50 text-green-600 border-green-200"
                    : "bg-ink/5 text-ink/40 hover:bg-ink hover:text-white border-transparent"
                )}
              >
                {isWordInBank(word.vocabulary) ? <Check size={16} /> : <Plus size={16} />}
              </button>
            </div>
            
            <p className="text-sm font-medium mb-3 leading-relaxed">{word.definition}</p>
            
            <div className="bg-paper/50 p-2 rounded border border-dashed border-ink/10">
              <p className="text-xs hand-text tracking-wide italic">"{word.example}"</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center py-10 opacity-40">
        <BookOpen className="mx-auto mb-2" size={32} />
        <p className="text-sm hand-text">Học tập trung theo cấp độ giúp bạn tiến bộ nhanh hơn.</p>
      </div>
    </div>
  );
}
