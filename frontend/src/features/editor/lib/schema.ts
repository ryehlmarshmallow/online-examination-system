import { z } from "zod";
import type { SystemLimitsResponse } from "@/shared/types/system";

// --- Base Schemas ---

export const questionTypeSchema = z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "ESSAY", "FILE"]);

export const optionSchema = z.object({
  id: z.number().optional(),
  text: z.string().default(""),
});

// --- Content Schemas ---

export const scContentSchema = z.object({
  options: z.array(optionSchema).default([]),
}).transform(val => ({
  ...val,
  options: val.options.map((opt, idx) => ({
    ...opt,
    id: opt.id ?? (idx + 1)
  }))
}));

export const mcContentSchema = z.object({
  options: z.array(optionSchema).default([]),
}).transform(val => ({
  ...val,
  options: val.options.map((opt, idx) => ({
    ...opt,
    id: opt.id ?? (idx + 1)
  }))
}));

export const essayContentSchema = z.object({
  minWords: z.number().optional(),
  maxWords: z.number().optional(),
  maxCharacters: z.number().optional(),
}).default({});

export const fileContentSchema = z.object({
  allowedExtensions: z.array(z.string()).default([]),
  maxFileSizeMegabytes: z.number().default(0),
  maxFileCount: z.number().default(1),
});

// --- Rubric Schemas ---

export const scRubricSchema = z.object({
  graderType: z.literal("DICHOTOMOUS"),
  correctOptionId: z.number().default(1),
});

export const mcRubricSchema = z.discriminatedUnion("graderType", [
  z.object({
    graderType: z.enum(["DICHOTOMOUS", "HALVING"]),
    correctOptionIds: z.array(z.number()).default([]),
  }),
  z.object({
    graderType: z.literal("WEIGHTED"),
    optionWeights: z.union([
      z.array(z.number()),
      z.record(z.string(), z.number())
    ]).transform((val) => {
      if (Array.isArray(val)) {
        const record: Record<string, number> = {};
        val.forEach((weight, idx) => {
          record[String(idx + 1)] = weight;
        });
        return record;
      }
      return val;
    }).default({}),
    allowNegativeWeights: z.boolean().default(false),
  }),
]);

export const manualRubricSchema = z.object({
  graderType: z.literal("MANUAL"),
});

// --- Question Schemas ---

export const baseQuestionSchema = z.object({
  id: z.string().optional(),
  prompt: z.string().default(""),
  points: z.number().default(1),
});

export const questionSchema = z.discriminatedUnion("type", [
  baseQuestionSchema.extend({
    type: z.literal("SINGLE_CHOICE"),
    content: scContentSchema.default({ options: [] }),
    rubric: scRubricSchema.default({ graderType: "DICHOTOMOUS", correctOptionId: 1 }),
  }),
  baseQuestionSchema.extend({
    type: z.literal("MULTIPLE_CHOICE"),
    content: mcContentSchema.default({ options: [] }),
    rubric: mcRubricSchema.default({ graderType: "DICHOTOMOUS", correctOptionIds: [] }),
  }),
  baseQuestionSchema.extend({
    type: z.literal("ESSAY"),
    content: essayContentSchema,
    rubric: manualRubricSchema.default({ graderType: "MANUAL" }),
  }),
  baseQuestionSchema.extend({
    type: z.literal("FILE"),
    content: fileContentSchema.default({ allowedExtensions: [], maxFileSizeMegabytes: 0, maxFileCount: 1 }),
    rubric: manualRubricSchema.default({ graderType: "MANUAL" }),
  }),
]);

// --- Group Schema ---

export const questionGroupSchema = z.object({
  id: z.string().optional(),
  isGroup: z.boolean().optional(),
  prompt: z.string().default(""),
  questions: z.array(questionSchema),
});

// --- Polymorphic Root Schema ---

export const assessmentItemSchema = z.union([
  questionSchema.transform((q) => ({
    isGroup: false as const,
    prompt: "",
    questions: [q],
  })),
  questionGroupSchema.transform((g) => ({
    ...g,
    isGroup: g.isGroup ?? false,
  })),
]);

export const assessmentSchema = z.array(assessmentItemSchema);

// --- Strict Validation Schema (with constraints) ---

export const createStrictQuestionSchema = (limits?: SystemLimitsResponse) =>
  questionSchema.superRefine((data, ctx) => {
    if (data.prompt.trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "Prompt must not be empty",
        path: ["prompt"],
      });
    }

    if (data.points < 0) {
      ctx.addIssue({
        code: "custom",
        message: "Points must be non-negative",
        path: ["points"],
      });
    }

    if (data.type === "SINGLE_CHOICE" || data.type === "MULTIPLE_CHOICE") {
      if (data.content.options.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: `${data.type === "SINGLE_CHOICE" ? "Single" : "Multiple"} choice question must have at least one option`,
          path: ["content", "options"],
        });
      }

      const optionIds = new Set(data.content.options.map(o => o.id).filter((id): id is number => id !== undefined));

      data.content.options.forEach((opt, idx) => {
        if (opt.text.trim() === "") {
          ctx.addIssue({
            code: "custom",
            message: "Option text must not be empty",
            path: ["content", "options", idx, "text"],
          });
        }
      });

      if (data.type === "SINGLE_CHOICE") {
        if (!optionIds.has(data.rubric.correctOptionId)) {
          ctx.addIssue({
            code: "custom",
            message: "Correct option must be one of the defined options",
            path: ["rubric", "correctOptionId"],
          });
        }
      }

      if (data.type === "MULTIPLE_CHOICE") {
        if (data.rubric.graderType === "WEIGHTED") {
          const weights = data.rubric.optionWeights;
          Object.keys(weights).forEach(key => {
            const id = Number(key);
            if (!optionIds.has(id)) {
              ctx.addIssue({
                code: "custom",
                message: `Option weight key '${key}' does not match any existing option ID`,
                path: ["rubric", "optionWeights", key],
              });
            }
          });
        } else {
          const correctIds = data.rubric.correctOptionIds;
          const uniqueCorrectIds = new Set(correctIds);

          if (uniqueCorrectIds.size !== correctIds.length) {
            ctx.addIssue({
              code: "custom",
              message: "Correct options must not contain duplicates",
              path: ["rubric", "correctOptionIds"],
            });
          }

          correctIds.forEach((id, idx) => {
            if (!optionIds.has(id)) {
              ctx.addIssue({
                code: "custom",
                message: "Correct option ID must match one of the defined options",
                path: ["rubric", "correctOptionIds", idx],
              });
            }
          });
        }
      }
    }

    if (data.type === "ESSAY") {
      if (data.content.minWords !== undefined) {
        if (data.content.minWords < 0) {
          ctx.addIssue({
            code: "custom",
            message: "Min words must be non-negative",
            path: ["content", "minWords"],
          });
        }
      }

      if (data.content.minWords !== undefined && data.content.maxWords !== undefined) {
        if (data.content.minWords > data.content.maxWords) {
          ctx.addIssue({
            code: "custom",
            message: "Min words cannot be greater than max words",
            path: ["content", "minWords"],
          });
        }
      }

      if (limits && data.content.maxCharacters !== undefined) {
        if (data.content.maxCharacters > limits.maxCharacters) {
          ctx.addIssue({
            code: "custom",
            message: `Max characters exceeds system limit of ${limits.maxCharacters}`,
            path: ["content", "maxCharacters"],
          });
        }
      }
    }

    if (data.type === "FILE" && limits) {
      if (data.content.maxFileSizeMegabytes > limits.maxFileSizeMegabytes) {
        ctx.addIssue({
          code: "custom",
          message: `Max file size exceeds system limit of ${limits.maxFileSizeMegabytes}MB`,
          path: ["content", "maxFileSizeMegabytes"],
        });
      }

      if (data.content.maxFileCount > limits.maxFileCount) {
        ctx.addIssue({
          code: "custom",
          message: `Max file count exceeds system limit of ${limits.maxFileCount}`,
          path: ["content", "maxFileCount"],
        });
      }

      const systemExts = new Set(limits.allowedExtensions.map(e => e.toLowerCase()));
      data.content.allowedExtensions.forEach((ext, idx) => {
        if (!systemExts.has(ext.toLowerCase())) {
          ctx.addIssue({
            code: "custom",
            message: `Extension '${ext}' is not allowed by system configuration`,
            path: ["content", "allowedExtensions", idx],
          });
        }
      });
    }
  });

export const createStrictQuestionGroupSchema = (limits?: SystemLimitsResponse) =>
  questionGroupSchema
    .extend({
      questions: z.array(createStrictQuestionSchema(limits)),
    })
    .superRefine((data, ctx) => {
      const isGroup = data.isGroup === true;
      if (!isGroup) {
        if (data.questions.length !== 1) {
          ctx.addIssue({
            code: "custom",
            message: "A standalone question must have exactly one question. If you intended this to be a group, set 'isGroup: true'.",
            path: ["questions"],
          });
        }
        if (data.prompt.trim() !== "") {
          ctx.addIssue({
            code: "custom",
            message: "A standalone question cannot have a group prompt. If you intended this to be a group, set 'isGroup: true'.",
            path: ["prompt"],
          });
        }
      }
    });

export const createStrictAssessmentSchema = (limits?: SystemLimitsResponse) => {
  const strictQuestionSchema = createStrictQuestionSchema(limits);
  const strictGroupSchema = createStrictQuestionGroupSchema(limits);

  return z.array(
    z.union([
      strictQuestionSchema.transform((q) => ({
        isGroup: false as const,
        prompt: "",
        questions: [q],
      })),
      strictGroupSchema.transform((g) => ({
        ...g,
        isGroup: g.isGroup ?? false,
      })),
    ])
  );
};

export type ValidatedAssessment = z.infer<typeof assessmentSchema>;
export type ValidatedAssessmentItem = z.infer<typeof assessmentItemSchema>;
export type ValidatedQuestionGroup = z.infer<typeof questionGroupSchema>;
export type ValidatedQuestion = z.infer<typeof questionSchema>;
