export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY" | "FILE";

export type GraderType =
  | "DICHOTOMOUS"
  | "HALVING"
  | "WEIGHTED"
  | "MANUAL";

export interface Option {
  id: string;
  text: string;
}

// --- Content Types ---

export interface SingleChoiceContent {
  options: Option[];
}

export interface MultipleChoiceContent {
  options: Option[];
}

export interface EssayContent {
  minWords?: number;
  maxWords?: number;
}

export interface FileContent {
  allowedExtensions: string[];
  maxFileSizeMegabytes: number;
}

// --- Rubric Types ---

export type SingleChoiceRubric = {
  graderType: "DICHOTOMOUS";
  correctOptionId: number;
};

export type MultipleChoiceRubric =
  | {
  graderType: "DICHOTOMOUS" | "HALVING";
  correctOptionIds: string[];
}
  | {
  graderType: "WEIGHTED";
  optionWeights: Record<string, number>;
  allowNegativeWeights: boolean;
};

export interface ManualRubric {
  graderType: "MANUAL";
}

// --- Discriminated Union for Question ---

interface BaseQuestion {
  id?: string;
  prompt: string;
  points: number;
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: "SINGLE_CHOICE";
  content: SingleChoiceContent;
  rubric: SingleChoiceRubric;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "MULTIPLE_CHOICE";
  content: MultipleChoiceContent;
  rubric: MultipleChoiceRubric;
}

export interface EssayQuestion extends BaseQuestion {
  type: "ESSAY";
  content: EssayContent;
  rubric: ManualRubric;
}

export interface FileQuestion extends BaseQuestion {
  type: "FILE";
  content: FileContent;
  rubric: ManualRubric;
}

export type Question = SingleChoiceQuestion | MultipleChoiceQuestion | EssayQuestion | FileQuestion;

// --- Question Group ---

export interface QuestionGroup {
  id?: string;
  prompt: string;
  questions: Question[];
}
