import YAML from "yaml";
import { assessmentSchema } from "./schema";
import type { Option } from "@/features/questions/types/question";
import type { QuestionGroupRequest } from "@/features/questionsets/api/questionset-api";

/**
 * Converts backend assessment group data into a clean YAML string for the editor.
 * It strips out IDs from options to keep the YAML concise.
 */
export function assessmentToYaml(questionGroups: QuestionGroupRequest[]): string {
  if (!questionGroups) return "";

  const groups = questionGroups.map(eg => ({
    prompt: eg.prompt || "",
    isGroup: eg.isGroup,
    questions: eg.questions.map(q => {
      const content = { ...q.content } as Record<string, unknown>;
      delete content.type;

      let finalContent = content;
      if ((q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE') && content.options) {
        finalContent = {
          ...content,
          options: (content.options as Option[]).map((opt: Option) =>
            Object.fromEntries(Object.entries(opt).filter(([key]) => key !== 'id'))
          )
        };
      }

      let rubric = { ...q.rubric } as Record<string, unknown>;
      delete rubric.questionType;

      if (q.type === 'MULTIPLE_CHOICE' && rubric.graderType === 'WEIGHTED' && rubric.optionWeights) {
        const weights = rubric.optionWeights as Record<string, number>;
        const contentObj = q.content as { options?: unknown[] } | undefined;
        const optionCount = contentObj?.options?.length ?? 0;
        const weightsArray: number[] = [];
        for (let i = 1; i <= optionCount; i++) {
          weightsArray.push(weights[String(i)] ?? weights[i] ?? 0);
        }
        rubric = {
          ...rubric,
          optionWeights: weightsArray
        };
      }

      return {
        prompt: q.prompt,
        type: q.type,
        points: q.points,
        content: finalContent,
        rubric
      };
    })
  }));

  return YAML.stringify(groups, {
    defaultStringType: 'QUOTE_DOUBLE',
    defaultKeyType: 'PLAIN',
  });
}

/**
 * Parses and validates YAML string from the editor, transforming it into the backend's expected structure.
 * This includes re-adding numeric IDs to options.
 */
export async function yamlToAssessmentGroups(yaml: string): Promise<QuestionGroupRequest[]> {
  const parsed = YAML.parse(yaml);
  const validation = assessmentSchema.safeParse(parsed);

  if (!validation.success) {
    throw new Error("Invalid assessment structure. Please check the code editor for errors.");
  }

  // The schema transforms single questions into group structures
  return validation.data.map(item => ({
    prompt: item.prompt,
    isGroup: item.isGroup,
    questions: item.questions.map(q => ({
      prompt: q.prompt,
      type: q.type,
      points: q.points,
      content: {
        ...q.content,
        type: q.type, // Add type discriminator for content
        options: (q.type === "MULTIPLE_CHOICE" || q.type === "SINGLE_CHOICE")
          ? (q.content as { options: { text: string }[] }).options.map((opt, idx: number) => ({
            ...opt,
            id: idx + 1 // Assign numeric IDs based on index
          }))
          : undefined
      },
      rubric: {
        ...q.rubric,
        questionType: q.type, // Add questionType for rubric
      }
    }))
  }));
}
