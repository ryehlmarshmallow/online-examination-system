import type {
  CompletionContext,
  CompletionResult
} from "@codemirror/autocomplete";
import { snippetCompletion } from "@codemirror/autocomplete";

export const yamlCompletions = (context: CompletionContext): CompletionResult | null => {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  return {
    from: word.from,
    options: [
      // --- Fields ---
      snippetCompletion('prompt: "${}"', { label: "prompt", type: "property" }),
      { label: "type", type: "property", apply: "type: " },
      snippetCompletion('points: ${1:1}', { label: "points", type: "property" }),
      snippetCompletion('content:\n  ${}', { label: "content", type: "property" }),
      snippetCompletion('rubric:\n  ${}', { label: "rubric", type: "property" }),
      snippetCompletion('options:\n  - text: "${}"', { label: "options", type: "property" }),
      snippetCompletion('text: "${}"', { label: "text", type: "property" }),
      { label: "graderType", type: "property", apply: "graderType: " },
      snippetCompletion('correctOptionIds:\n  - ${}', { label: "correctOptionIds", type: "property" }),
      snippetCompletion('correctOptionId: ${}', { label: "correctOptionId", type: "property" }),
      snippetCompletion('optionWeights:\n  - ${1:1.0}', { label: "optionWeights", type: "property" }),
      snippetCompletion('allowNegativeWeights: ${1:false}', { label: "allowNegativeWeights", type: "property" }),
      snippetCompletion('minWords: ${}', { label: "minWords", type: "property" }),
      snippetCompletion('maxWords: ${}', { label: "maxWords", type: "property" }),
      snippetCompletion('allowedExtensions: [${}]', { label: "allowedExtensions", type: "property" }),
      snippetCompletion('maxFileSizeMegabytes: ${}', { label: "maxFileSizeMegabytes", type: "property" }),

      // --- Enum Values ---
      { label: "SINGLE_CHOICE", type: "keyword" },
      { label: "MULTIPLE_CHOICE", type: "keyword" },
      { label: "ESSAY", type: "keyword" },
      { label: "FILE", type: "keyword" },
      { label: "DICHOTOMOUS", type: "keyword" },
      { label: "HALVING", type: "keyword" },
      { label: "WEIGHTED", type: "keyword" },
      { label: "MANUAL", type: "keyword" },

      // --- Structural Snippets ---
      snippetCompletion([
        '- prompt: "${1}"',
        "  type: SINGLE_CHOICE",
        "  points: ${2:1}",
        "  content:",
        "    options:",
        '      - text: "${3}"',
        '      - text: "${4}"',
        "  rubric:",
        "    correctOptionId: ${5:1}",
        "    graderType: DICHOTOMOUS",
      ].join("\n"), {
        label: "nscd",
        type: "snippet",
        detail: "Single Choice question (Dichotomous)"
      }),
      snippetCompletion([
        '- prompt: "${1}"',
        "  type: MULTIPLE_CHOICE",
        "  points: ${2:1}",
        "  content:",
        "    options:",
        '      - text: "${3}"',
        '      - text: "${4}"',
        "  rubric:",
        "    correctOptionIds:",
        "      - ${5:1}",
        "    graderType: DICHOTOMOUS",
      ].join("\n"), {
        label: "nmcd",
        type: "snippet",
        detail: "Multiple Choice question (Dichotomous)"
      }),
      snippetCompletion([
        '- prompt: "${1}"',
        "  type: MULTIPLE_CHOICE",
        "  points: ${2:1}",
        "  content:",
        "    options:",
        '      - text: "${3}"',
        '      - text: "${4}"',
        "  rubric:",
        "    correctOptionIds:",
        "      - ${5:1}",
        "    graderType: HALVING",
      ].join("\n"), {
        label: "nmch",
        type: "snippet",
        detail: "Multiple Choice question (Halving)"
      }),
      snippetCompletion([
        '- prompt: "${1}"',
        "  type: MULTIPLE_CHOICE",
        "  points: ${2:1}",
        "  content:",
        "    options:",
        '      - text: "${3}"',
        '      - text: "${4}"',
        "  rubric:",
        "    optionWeights:",
        "      - ${5:1.0}",
        "      - 0.0",
        "    allowNegativeWeights: false",
        "    graderType: WEIGHTED",
      ].join("\n"), {
        label: "nmcw",
        type: "snippet",
        detail: "Multiple Choice question (Weighted)"
      }),
      snippetCompletion([
        '- prompt: "${1}"',
        "  type: ESSAY",
        "  points: ${2:5}",
        "  content:",
        "    minWords: ${3:50}",
        "    maxWords: ${4:500}",
        "  rubric:",
        "    graderType: MANUAL",
      ].join("\n"), {
        label: "ne",
        type: "snippet",
        detail: "Essay question"
      }),
      snippetCompletion([
        '- prompt: "${1}"',
        "  type: FILE",
        "  points: ${2:5}",
        "  content:",
        "    allowedExtensions: [\"pdf\", \"zip\"]",
        "    maxFileSizeMegabytes: ${3:10}",
        "  rubric:",
        "    graderType: MANUAL",
      ].join("\n"), {
        label: "nf",
        type: "snippet",
        detail: "File upload question"
      }),
      snippetCompletion([
        '- prompt: "${1}"',
        '  isGroup: true',
        "  questions:",
        '    - prompt: "${2}"',
        "      type: SINGLE_CHOICE",
        "      points: ${3:1}",
        "      content:",
        "        options:",
        '          - text: "${4}"',
        "      rubric:",
        "        correctOptionId: ${5:1}",
        "        graderType: DICHOTOMOUS",
      ].join("\n"), {
        label: "ng",
        type: "snippet",
        detail: "Question Group"
      }),
      snippetCompletion([
        '- prompt: "${1}"',
        '  isGroup: true',
        "  questions:",
        '    - prompt: "${2}"',
        "      type: SINGLE_CHOICE",
        "      points: ${3:1}",
        "      content:",
        "        options:",
        '          - text: "${4}"',
        "      rubric:",
        "        correctOptionId: ${5:1}",
        "        graderType: DICHOTOMOUS",
      ].join("\n"), {
        label: "ngscd",
        type: "snippet",
        detail: "Question Group (Single Choice)"
      }),
      snippetCompletion([
        '- prompt: "${1}"',
        '  isGroup: true',
        "  questions:",
        '    - prompt: "${2}"',
        "      type: MULTIPLE_CHOICE",
        "      points: ${3:1}",
        "      content:",
        "        options:",
        '          - text: "${4}"',
        '          - text: "${5}"',
        "      rubric:",
        "        correctOptionIds:",
        "          - ${6:1}",
        "        graderType: DICHOTOMOUS",
      ].join("\n"), {
        label: "ngmcd",
        type: "snippet",
        detail: "Question Group (Multiple Choice Dichotomous)"
      }),
      snippetCompletion([
        '- prompt: "${1}"',
        '  isGroup: true',
        "  questions:",
        '    - prompt: "${2}"',
        "      type: MULTIPLE_CHOICE",
        "      points: ${3:1}",
        "      content:",
        "        options:",
        '          - text: "${4}"',
        '          - text: "${5}"',
        "      rubric:",
        "        correctOptionIds:",
        "          - ${6:1}",
        "        graderType: HALVING",
      ].join("\n"), {
        label: "ngmch",
        type: "snippet",
        detail: "Question Group (Multiple Choice Halving)"
      }),
      snippetCompletion([
        '- prompt: "${1}"',
        '  isGroup: true',
        "  questions:",
        '    - prompt: "${2}"',
        "      type: MULTIPLE_CHOICE",
        "      points: ${3:1}",
        "      content:",
        "        options:",
        '          - text: "${4}"',
        '          - text: "${5}"',
        "      rubric:",
        "        optionWeights:",
        "          - ${6:1.0}",
        "          - 0.0",
        "        allowNegativeWeights: false",
        "        graderType: WEIGHTED",
      ].join("\n"), {
        label: "ngmcw",
        type: "snippet",
        detail: "Question Group (Multiple Choice Weighted)"
      }),
      snippetCompletion([
        '- prompt: "${1}"',
        '  isGroup: true',
        "  questions:",
        '    - prompt: "${2}"',
        "      type: ESSAY",
        "      points: ${3:5}",
        "      content:",
        "        minWords: ${4:50}",
        "        maxWords: ${5:500}",
        "      rubric:",
        "        graderType: MANUAL",
      ].join("\n"), {
        label: "nge",
        type: "snippet",
        detail: "Question Group (Essay)"
      }),
      snippetCompletion([
        '- prompt: "${1}"',
        '  isGroup: true',
        "  questions:",
        '    - prompt: "${2}"',
        "      type: FILE",
        "      points: ${3:5}",
        "      content:",
        "        allowedExtensions: [\"pdf\", \"zip\"]",
        "        maxFileSizeMegabytes: ${4:10}",
        "      rubric:",
        "        graderType: MANUAL",
      ].join("\n"), {
        label: "ngf",
        type: "snippet",
        detail: "Question Group (File Upload)"
      }),
    ]
  };
};
