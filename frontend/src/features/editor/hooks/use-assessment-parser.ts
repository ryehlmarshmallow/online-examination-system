import { useMemo } from "react";
import YAML from "yaml";
import {
  assessmentItemSchema,
  createStrictAssessmentSchema,
  questionSchema,
  questionGroupSchema,
  createStrictQuestionSchema,
  createStrictQuestionGroupSchema
} from "../lib/schema";
import type { ValidatedAssessmentItem } from "../lib/schema";
import {
  ZodError,
  z
} from "zod";
import type { SystemLimitsResponse } from "@/shared/types/system";

export type AssessmentItemResult =
  | {
  success: true;
  data: ValidatedAssessmentItem;
  range?: [number, number, number, number];
  issueRanges?: Record<number, [number, number, number, number]>
}
  | {
  success: false;
  error: ZodError;
  data?: ValidatedAssessmentItem;
  raw: unknown;
  range?: [number, number, number, number];
  issueRanges?: Record<number, [number, number, number, number]>
};

function getRangeForPath(node: unknown, path: (string | number)[], lineCounter: YAML.LineCounter): [number, number, number, number] | undefined {
  if (!node || typeof node !== 'object' || !('getIn' in node)) return undefined;

  const yamlNode = node as YAML.Node & { getIn: (path: (string | number)[], keepScalar?: boolean) => unknown };

  try {
    const adjustedPath = [...path];
    const optionWeightsIdx = adjustedPath.indexOf("optionWeights");
    if (optionWeightsIdx !== -1 && optionWeightsIdx < adjustedPath.length - 1) {
      const key = adjustedPath[optionWeightsIdx + 1];
      if (typeof key === "string" && !isNaN(Number(key))) {
        const parentPath = adjustedPath.slice(0, optionWeightsIdx + 1);
        const parentNode = yamlNode.getIn(parentPath, true) as (YAML.Node & { type?: string; items?: unknown[] }) | undefined;
        if (parentNode && (parentNode.type === "SEQ" || Array.isArray(parentNode.items))) {
          adjustedPath[optionWeightsIdx + 1] = Number(key) - 1;
        }
      }
    }

    // Try to get the specific node for the path
    const targetNode = yamlNode.getIn(adjustedPath, true) as YAML.Node | undefined;
    if (targetNode && targetNode.range) {
      const start = lineCounter.linePos(targetNode.range[0]);
      const end = lineCounter.linePos(targetNode.range[1]);
      return [start.line, start.col, end.line, end.col];
    }

    // If exact path not found (e.g. missing field), try parent path
    if (path.length > 0) {
      return getRangeForPath(node, path.slice(0, -1), lineCounter);
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function getDetailedError(rawValue: unknown): ZodError | null {
  if (!rawValue || typeof rawValue !== 'object') return null;

  const obj = rawValue as Record<string, unknown>;
  const isProbablyGroup = 'questions' in obj || (typeof obj.isGroup === 'boolean' && obj.isGroup);

  if (isProbablyGroup) {
    const groupResult = questionGroupSchema.safeParse(rawValue);
    return groupResult.success ? null : groupResult.error;
  } else {
    const questionResult = questionSchema.safeParse(rawValue);
    return questionResult.success ? null : questionResult.error;
  }
}

function getDetailedStrictError(rawValue: unknown, limits?: SystemLimitsResponse): ZodError | null {
  if (!rawValue || typeof rawValue !== 'object') return null;

  const obj = rawValue as Record<string, unknown>;
  const isProbablyGroup = 'questions' in obj || (typeof obj.isGroup === 'boolean' && obj.isGroup);

  if (isProbablyGroup) {
    const groupResult = createStrictQuestionGroupSchema(limits).safeParse(rawValue);
    return groupResult.success ? null : groupResult.error;
  } else {
    const questionResult = createStrictQuestionSchema(limits).safeParse(rawValue);
    return questionResult.success ? null : questionResult.error;
  }
}

export function validateItem(rawValue: unknown, limits?: SystemLimitsResponse): AssessmentItemResult {
  // Step 1: Structural Validation (Lenient)
  const structural = assessmentItemSchema.safeParse(rawValue);

  if (structural.success) {
    // Step 2: Strict Validation (Constraints)
    const strictSchema = createStrictAssessmentSchema(limits);
    const strict = strictSchema.safeParse([rawValue]);

    if (strict.success) {
      return { success: true, data: structural.data };
    } else {
      // Try to get a more detailed strict error
      const detailedStrictError = getDetailedStrictError(rawValue, limits);
      const itemError = detailedStrictError || new ZodError(strict.error.issues.filter(issue => issue.path[0] === 0).map(issue => ({
        ...issue,
        path: issue.path.slice(1)
      })));

      return {
        success: false,
        error: itemError,
        data: structural.data,
        raw: rawValue
      };
    }
  } else {
    // Structural failure - try to get a more detailed error
    const detailedError = getDetailedError(rawValue);
    return { success: false, error: detailedError || structural.error, raw: rawValue };
  }
}

export function useAssessmentParser(yamlString: string, limits?: SystemLimitsResponse) {
  const strictSchema = useMemo(() => createStrictAssessmentSchema(limits), [limits]);

  return useMemo(() => {
    const lineCounter = new YAML.LineCounter();
    try {
      const doc = YAML.parseDocument(yamlString, { lineCounter });
      const parsed = doc.toJS();

      if (!parsed) {
        return { items: [], syntaxError: null, allSyntaxErrors: [], hasValidationErrors: false };
      }

      if (!Array.isArray(parsed)) {
        return {
          items: [],
          syntaxError: "YAML must be a top-level array of questions or groups.",
          allSyntaxErrors: [],
          hasValidationErrors: false
        };
      }

      const items: AssessmentItemResult[] = [];
      const root = doc.contents;

      // Full structural parse
      const structuralResult = z.array(assessmentItemSchema).safeParse(parsed);
      // Full strict parse
      const strictResult = strictSchema.safeParse(parsed);

      if (root && 'items' in root && Array.isArray(root.items)) {
        for (let i = 0; i < root.items.length; i++) {
          const node = root.items[i] as { range?: [number, number, number] | null };
          const rawValue = parsed[i];

          let result: AssessmentItemResult;

          const itemStructural = structuralResult.success
            ? { success: true as const, data: structuralResult.data[i] }
            : assessmentItemSchema.safeParse(rawValue);

          if (itemStructural.success) {
            const itemStrictIssues = strictResult.success
              ? []
              : strictResult.error.issues.filter(issue => issue.path[0] === i);

            if (itemStrictIssues.length === 0) {
              result = { success: true, data: itemStructural.data };
            } else {
              const detailedStrictError = getDetailedStrictError(rawValue, limits);
              result = {
                success: false,
                error: detailedStrictError || new ZodError(itemStrictIssues.map(issue => ({
                  ...issue,
                  path: issue.path.slice(1)
                }))),
                data: itemStructural.data,
                raw: rawValue
              };
            }
          } else {
            // Structural failure - try to get a more detailed error
            const detailedError = getDetailedError(rawValue);
            result = { success: false, error: detailedError || itemStructural.error, raw: rawValue };
          }

          let range: [number, number, number, number] | undefined;
          if (node && node.range) {
            const start = lineCounter.linePos(node.range[0]);
            const end = lineCounter.linePos(node.range[1]);
            range = [start.line, start.col, end.line, end.col];
          }

          // Calculate precise ranges for each issue
          const issueRanges: Record<number, [number, number, number, number]> = {};
          if (!result.success && node) {
            result.error.issues.forEach((issue, idx) => {
              const issueRange = getRangeForPath(node, issue.path as (string | number)[], lineCounter);
              if (issueRange) {
                issueRanges[idx] = issueRange;
              }
            });
          }

          items.push({ ...result, range, issueRanges });
        }
      }

      const syntaxErrors = doc.errors.map(err => {
        const linePos = (err as { linePos?: { line: number; col: number } }).linePos;
        const pos = linePos || lineCounter.linePos(err.pos[0]);
        return {
          message: err.message,
          line: pos.line,
          col: pos.col
        };
      });

      const hasValidationErrors = items.some(it => !it.success);

      return {
        items,
        syntaxError: syntaxErrors.length > 0 ? syntaxErrors[0].message : null,
        allSyntaxErrors: syntaxErrors,
        hasValidationErrors
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid YAML syntax";
      return {
        items: [],
        syntaxError: message,
        allSyntaxErrors: [],
        hasValidationErrors: false
      };
    }
  }, [yamlString, strictSchema, limits]);
}
