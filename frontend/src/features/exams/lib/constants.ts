export const VISIBILITY_OPTIONS = [
  { label: "Not View After Finished", value: "NOT_VIEW_AFTER_FINISHED" },
  { label: "View After Each Attempt", value: "VIEW_AFTER_FINISHED_EACH_ATTEMPT" },
  { label: "View After All Finish", value: "VIEW_AFTER_ALL_STUDENTS_FINISH_FIRST_ATTEMPT" },
] as const;

export const VISIBILITY_LABELS: Record<string, string> = {
  "NOT_VIEW_AFTER_FINISHED": "Not View After Finished",
  "VIEW_AFTER_FINISHED_EACH_ATTEMPT": "View After Each Attempt",
  "VIEW_AFTER_ALL_STUDENTS_FINISH_FIRST_ATTEMPT": "View After All Finish",
};

export const EXAM_STATUS_LABELS: Record<string, string> = {
  "NOT_STARTED": "Not Started",
  "RUNNING": "Running",
  "EXPIRED": "Expired",
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  "SINGLE_CHOICE": "Single Choice",
  "MULTIPLE_CHOICE": "Multiple Choice",
  "ESSAY": "Essay",
  "FILE": "File Upload",
};

export const ATTEMPT_STATUS_LABELS: Record<string, string> = {
  "IN_PROGRESS": "In Progress",
  "SUBMITTED": "Submitted",
  "GRADED": "Graded",
};
