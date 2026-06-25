import type {
  ValidatedQuestionGroup,
  ValidatedQuestion,
  ValidatedAssessmentItem
} from "../lib/schema";

export function useVisualItemUpdater(
  group: ValidatedAssessmentItem,
  onChange: (updatedItem: (ValidatedQuestionGroup | ValidatedQuestion)) => void
) {
  const updateGroup = (updates: Partial<ValidatedQuestionGroup>) => {
    let newData = { ...group, ...updates } as ValidatedAssessmentItem;

    // If it becomes "group-like", ensure isGroup is true
    if (newData.questions.length > 1 || newData.prompt) {
      newData = { ...newData, isGroup: true };
    }

    // Only degrade to a single question if it was NOT a group originally
    // and it currently looks like a single question (no prompt, 1 question)
    if (!newData.isGroup && !newData.prompt && newData.questions.length === 1) {
      const q = newData.questions[0];
      // Normalizing order for YAML serialization: type first, then points
      const { type, points, ...rest } = q;
      onChange({ type, points, ...rest } as ValidatedQuestion);
    } else {
      onChange(newData as ValidatedQuestionGroup);
    }
  };

  const promoteToGroup = () => {
    updateGroup({ isGroup: true });
  };

  const downgradeToSingle = () => {
    if (group.questions.length > 0) {
      const firstQ = group.questions[0];
      const { type, points, ...rest } = firstQ;
      onChange({ type, points, ...rest } as ValidatedQuestion);
    }
  };

  const deleteQuestion = (qIndex: number) => {
    const newQuestions = group.questions.filter((_, i) => i !== qIndex);
    updateGroup({ questions: newQuestions });
  };

  const updateQuestion = (qIndex: number, updates: Partial<ValidatedQuestion>) => {
    const newQuestions = [...group.questions];
    const merged = { ...newQuestions[qIndex], ...updates } as ValidatedQuestion;

    // Enforce key order: type then points for YAML serialization
    const { type, points, ...rest } = merged;
    const ordered = { type, points, ...rest };

    newQuestions[qIndex] = ordered as ValidatedQuestion;
    updateGroup({ questions: newQuestions });
  };

  const changeQuestionType = (qIndex: number, newType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY" | "FILE") => {
    let updates: Partial<ValidatedQuestion>;

    if (newType === "SINGLE_CHOICE") {
      updates = {
        type: "SINGLE_CHOICE",
        content: { options: [{ id: 1, text: "" }, { id: 2, text: "" }] },
        rubric: { graderType: "DICHOTOMOUS", correctOptionId: 1 }
      };
    } else if (newType === "MULTIPLE_CHOICE") {
      updates = {
        type: "MULTIPLE_CHOICE",
        content: { options: [{ id: 1, text: "" }, { id: 2, text: "" }] },
        rubric: { graderType: "DICHOTOMOUS", correctOptionIds: [] }
      };
    } else if (newType === "ESSAY") {
      updates = {
        type: "ESSAY",
        content: { minWords: 0, maxWords: 500 },
        rubric: { graderType: "MANUAL" }
      };
    } else {
      updates = {
        type: "FILE",
        content: { allowedExtensions: ["pdf"], maxFileSizeMegabytes: 10, maxFileCount: 1 },
        rubric: { graderType: "MANUAL" }
      };
    }

    updateQuestion(qIndex, updates);
  };

  const insertQuestion = (qIndex: number) => {
    const newQuestions = [...group.questions];
    const newItem: ValidatedQuestion = {
      type: "SINGLE_CHOICE",
      points: 1,
      prompt: "",
      content: {
        options: [{ id: 1, text: "" }, { id: 2, text: "" }]
      },
      rubric: {
        graderType: "DICHOTOMOUS",
        correctOptionId: 1
      }
    };
    newQuestions.splice(qIndex, 0, newItem);
    updateGroup({ questions: newQuestions });
  };

  return {
    updateGroup,
    updateQuestion,
    changeQuestionType,
    insertQuestion,
    promoteToGroup,
    downgradeToSingle,
    deleteQuestion
  };
}
