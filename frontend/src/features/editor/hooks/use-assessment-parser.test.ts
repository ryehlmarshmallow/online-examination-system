import { renderHook } from '@testing-library/react';
import {
  useAssessmentParser,
  validateItem
} from './use-assessment-parser';
import {
  assessmentToYaml,
  yamlToAssessmentGroups
} from '../lib/yaml-mapper';

describe('useAssessmentParser hook', () => {
  it('should return empty items and no error for empty yamlString', () => {
    const { result } = renderHook(() => useAssessmentParser(''));
    expect(result.current.items).toEqual([]);
    expect(result.current.syntaxError).toBeNull();
    expect(result.current.hasValidationErrors).toBe(false);
  });

  it('should report syntax error if top level is not an array', () => {
    const yaml = `
type: SINGLE_CHOICE
prompt: "Hello"
`;
    const { result } = renderHook(() => useAssessmentParser(yaml));
    expect(result.current.items).toEqual([]);
    expect(result.current.syntaxError).toBe('YAML must be a top-level array of questions or groups.');
  });

  it('should parse valid single choice question correctly', () => {
    const yaml = `
- type: SINGLE_CHOICE
  prompt: "What is 2 + 2?"
  points: 5
  content:
    options:
      - text: "3"
      - text: "4"
  rubric:
    graderType: DICHOTOMOUS
    correctOptionId: 2
`;
    const { result } = renderHook(() => useAssessmentParser(yaml));
    expect(result.current.syntaxError).toBeNull();
    expect(result.current.items).toHaveLength(1);

    const item = result.current.items[0];
    expect(item.success).toBe(true);
    if (item.success) {
      expect(item.data.isGroup).toBe(false);
      const q = item.data.questions[0];
      expect(q.type).toBe('SINGLE_CHOICE');
      expect(q.prompt).toBe('What is 2 + 2?');
      expect(q.points).toBe(5);
    }
  });

  it('should detect strict validation issues like empty prompt or negative points', () => {
    const yaml = `
- type: SINGLE_CHOICE
  prompt: ""
  points: -10
  content:
    options:
      - text: "A"
  rubric:
    graderType: DICHOTOMOUS
    correctOptionId: 99
`;
    const { result } = renderHook(() => useAssessmentParser(yaml));
    expect(result.current.items).toHaveLength(1);

    const item = result.current.items[0];
    expect(item.success).toBe(false);
    if (!item.success) {
      const messages = item.error.issues.map(i => i.message);
      expect(messages).toContain('Prompt must not be empty');
      expect(messages).toContain('Points must be non-negative');
      expect(messages).toContain('Correct option must be one of the defined options');
    }
  });

  it('should parse question groups correctly', () => {
    const yaml = `
- isGroup: true
  prompt: "Common Context"
  questions:
    - type: ESSAY
      prompt: "Explain relativity"
      points: 10
`;
    const { result } = renderHook(() => useAssessmentParser(yaml));
    expect(result.current.items).toHaveLength(1);

    const item = result.current.items[0];
    expect(item.success).toBe(true);
    if (item.success) {
      expect(item.data.isGroup).toBe(true);
      expect(item.data.prompt).toBe('Common Context');
      expect(item.data.questions).toHaveLength(1);
      expect(item.data.questions[0].type).toBe('ESSAY');
    }
  });

  it('should map issueRanges correctly for syntax/validation issues', () => {
    const yaml = `
- type: SINGLE_CHOICE
  prompt: ""
  points: 1
`;
    const { result } = renderHook(() => useAssessmentParser(yaml));
    expect(result.current.items).toHaveLength(1);

    const item = result.current.items[0];
    expect(item.success).toBe(false);
    if (!item.success) {
      expect(item.issueRanges).toBeDefined();
      expect(Object.keys(item.issueRanges!)).not.toHaveLength(0);
    }
  });

  it('should parse multiple choice question with optionWeights as a list', () => {
    const yaml = `
- type: MULTIPLE_CHOICE
  prompt: "Select correct answers"
  points: 10
  content:
    options:
      - text: "Option A"
      - text: "Option B"
  rubric:
    graderType: WEIGHTED
    optionWeights:
      - 2.5
      - -1.5
`;
    const { result } = renderHook(() => useAssessmentParser(yaml));
    expect(result.current.syntaxError).toBeNull();
    expect(result.current.items).toHaveLength(1);

    const item = result.current.items[0];
    expect(item.success).toBe(true);
    if (item.success) {
      const q = item.data.questions[0];
      expect(q.type).toBe('MULTIPLE_CHOICE');
      expect(q.rubric.graderType).toBe('WEIGHTED');
      expect((q.rubric as { optionWeights?: Record<string, number> }).optionWeights).toEqual({
        "1": 2.5,
        "2": -1.5
      });
    }
  });
});

describe('validateItem helper function', () => {
  it('should validate single choice item successfully', () => {
    const raw = {
      type: 'SINGLE_CHOICE',
      prompt: 'Is it true?',
      points: 2,
      content: {
        options: [{ text: 'Yes' }, { text: 'No' }]
      },
      rubric: {
        graderType: 'DICHOTOMOUS',
        correctOptionId: 1
      }
    };
    const result = validateItem(raw);
    expect(result.success).toBe(true);
  });

  it('should fail validation with invalid data types', () => {
    const raw = {
      type: 'SINGLE_CHOICE',
      prompt: 12345,
      points: 'not-a-number'
    };
    const result = validateItem(raw);
    expect(result.success).toBe(false);
  });
});

describe('yaml mapper functions', () => {
  it('should convert question groups with optionWeights to YAML with list format', () => {
    const groups: Parameters<typeof assessmentToYaml>[0] = [{
      prompt: "Group 1",
      isGroup: false,
      questions: [{
        prompt: "Weighted Question",
        type: "MULTIPLE_CHOICE",
        points: 5,
        content: {
          options: [
            { text: "Opt 1" },
            { text: "Opt 2" }
          ]
        },
        rubric: {
          graderType: "WEIGHTED",
          optionWeights: {
            "1": 3.0,
            "2": -1.0
          },
          allowNegativeWeights: true
        }
      }]
    }];

    const yaml = assessmentToYaml(groups);
    expect(yaml).toContain('optionWeights:');
    // Ensure it contains list notation
    expect(yaml).toContain('- 3');
    expect(yaml).toContain('- -1');
    expect(yaml).not.toContain('"1":');
  });

  it('should map YAML with list optionWeights to assessment groups with record format', async () => {
    const yaml = `
- prompt: ""
  isGroup: false
  questions:
    - prompt: "Weighted Question"
      type: MULTIPLE_CHOICE
      points: 5
      content:
        options:
          - text: "Opt 1"
          - text: "Opt 2"
      rubric:
        graderType: WEIGHTED
        optionWeights:
          - 3.0
          - -1.0
        allowNegativeWeights: true
`;
    const groups = await yamlToAssessmentGroups(yaml);
    expect(groups).toHaveLength(1);
    const q = groups[0].questions[0];
    expect(q.rubric.optionWeights).toEqual({
      "1": 3,
      "2": -1
    });
  });
});
