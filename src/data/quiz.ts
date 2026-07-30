/** Quiz content from Das_grosse_WG_Quiz.md – correct answers stay server-side */

export type QuizOptionKey = "A" | "B" | "C" | "D";

export interface QuizSingleQuestion {
  id: number;
  type: "single";
  question: string;
  options: Record<QuizOptionKey, string>;
  correct: QuizOptionKey;
}

export interface QuizMatchingQuestion {
  id: number;
  type: "matching";
  question: string;
  hint: string;
  matchingItems: Array<{ id: string; label: string }>;
  matchingOptions: Record<QuizOptionKey, string>;
  /** roommate id → option letter */
  correct: Record<string, QuizOptionKey>;
}

export type QuizQuestion = QuizSingleQuestion | QuizMatchingQuestion;

/** Safe for clients – without answers */
export type PublicQuizQuestion =
  | Omit<QuizSingleQuestion, "correct">
  | Omit<QuizMatchingQuestion, "correct">;

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    type: "single",
    question: "An welchem Datum sind wir eingezogen?",
    options: {
      A: "15.03.2022",
      B: "01.10.2024",
      C: "01.03.2022",
      D: "22.02.1503",
    },
    correct: "A",
  },
  {
    id: 2,
    type: "single",
    question: "Wie hoch war unser höchster Pfandbon?",
    options: {
      A: "105€",
      B: "115€",
      C: "125€",
      D: "135€",
    },
    correct: "D",
  },
  {
    id: 3,
    type: "single",
    question: "An welches Medikament erinnert der Haus- und Hoffahrer der WG?",
    options: {
      A: "Penicillin",
      B: "Aspirin",
      C: "Ibuprofen",
      D: "Actimel",
    },
    correct: "C",
  },
  {
    id: 4,
    type: "single",
    question:
      "Vervollständige den Text: „Macht ihr Studentenkackvögel noch einmal Nachts Randale im Innenhof …“",
    options: {
      A: "ruf ich die Bullen!!!",
      B: "zünd ich euren Weihnachtsbaum an!!!",
      C: "scheiß ich euch vor die Tür!!!",
      D: "kotz ich euch in den Briefkasten!!!",
    },
    correct: "C",
  },
  {
    id: 5,
    type: "single",
    question: "Wie heißen die beiden WG-Playmobilfiguren?",
    options: {
      A: "Atoomus & Luise",
      B: "Bobius & Nancy",
      C: "Chellwegius & Angel",
      D: "Dhagebaumarktius & Dyson",
    },
    correct: "A",
  },
  {
    id: 6,
    type: "matching",
    question: "Ordne das Körperteil dem jeweiligen Mitbewohner zu.",
    hint: "Trage hinter jedem Namen den Buchstaben A–D ein.",
    matchingItems: [
      { id: "1", label: "Leo" },
      { id: "2", label: "Marten" },
      { id: "3", label: "Jan-Nick" },
      { id: "4", label: "Moritz" },
    ],
    matchingOptions: {
      A: "Finger",
      B: "keine Ahnung",
      C: "Penis",
      D: "Bizeps",
    },
    correct: { "1": "D", "2": "A", "3": "C", "4": "B" },
  },
  {
    id: 7,
    type: "single",
    question: "Was findet man in dem Badezimmer mit der Dusche und Toilette NICHT?",
    options: {
      A: "Schimmel",
      B: "eine funktionierende Lüftung",
      C: "Box für Damenhygiene",
      D: "einen Mülleimer",
    },
    correct: "B",
  },
  {
    id: 8,
    type: "single",
    question: "In welcher Räumlichkeit wurde noch NICHT onaniert?",
    options: {
      A: "Wohnzimmer",
      B: "Badezimmer (nur Toilette)",
      C: "Küche",
      D: "Badezimmer (Dusche und Toilette)",
    },
    correct: "C",
  },
  {
    id: 9,
    type: "single",
    question: "Wie viele geklaute Gläser, die noch heil sind, befinden sich in der WG?",
    options: {
      A: "10",
      B: "11",
      C: "12",
      D: "13",
    },
    correct: "C",
  },
  {
    id: 10,
    type: "single",
    question: "Wie heißt der Staubsaugerroboter der WG?",
    options: {
      A: "Xoro",
      B: "Giesbert",
      C: "Fr. Wehe",
      D: "Sir Ruber",
    },
    correct: "A",
  },
];

export function getPublicQuizQuestions(): PublicQuizQuestion[] {
  return QUIZ_QUESTIONS.map((q) => {
    if (q.type === "single") {
      const { correct: _c, ...rest } = q;
      return rest;
    }
    const { correct: _c, ...rest } = q;
    return rest;
  });
}

export function scoreQuizAnswers(
  answers: Record<string, string | Record<string, string>>
): { correctCount: number; total: number } {
  let correctCount = 0;
  for (const q of QUIZ_QUESTIONS) {
    const raw = answers[String(q.id)];
    if (q.type === "single") {
      if (typeof raw === "string" && raw.toUpperCase() === q.correct) {
        correctCount += 1;
      }
    } else {
      if (!raw || typeof raw !== "object") continue;
      const allMatch = q.matchingItems.every((item) => {
        const given = String(
          (raw as Record<string, string>)[item.id] ?? ""
        )
          .trim()
          .toUpperCase();
        return given === q.correct[item.id];
      });
      if (allMatch) correctCount += 1;
    }
  }
  return { correctCount, total: QUIZ_QUESTIONS.length };
}

export function getQuizResultTier(correctCount: number): {
  emoji: string;
  title: string;
  body: string;
  accent: string;
} {
  if (correctCount >= 10) {
    return {
      emoji: "🏆",
      title: "Du bist eine WG-Legende!",
      body: "Unglaublich! Du kennst die WG besser als manche Bewohner.",
      accent: "#C9A227",
    };
  }
  if (correctCount >= 8) {
    return {
      emoji: "🎉",
      title: "Ehrenwerter WG-Gast!",
      body: "Starkes Ergebnis! Man merkt, dass du schon einige legendäre Momente mit uns erlebt hast.",
      accent: "#2E7D32",
    };
  }
  if (correctCount >= 5) {
    return {
      emoji: "🍻",
      title:
        "Hättest gerne häufiger kommen können, dann hättest du auch mehr gewusst.",
      body: 'Gar nicht schlecht – aber da fehlt noch viel bis zum Titel "WG-Legende".',
      accent: "#E65100",
    };
  }
  if (correctCount >= 2) {
    return {
      emoji: "🤔",
      title: "Kennst du uns überhaupt?",
      body: "Das war eher ausbaufähig. Vielleicht solltest du mehr trinken, damit sich dein Gehirn mehr merken kann von den Abenden.",
      accent: "#5C6BC0",
    };
  }
  return {
    emoji: "💀",
    title: "Das ist ja erbärmlich – du solltest wirklich zu allen Events kommen!",
    body: "Da fehlen uns die Worte",
    accent: "#C62828",
  };
}

