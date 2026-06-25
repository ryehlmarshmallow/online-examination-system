import {
  useState,
  useMemo
} from "react";
import { useParams } from "react-router-dom"
import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import {
  getExamDetail,
  updateExamQuestions
} from "../api/exam-api";
import { Spinner } from "@/shared/components/ui/spinner";
import { AssessmentEditor } from "@/features/editor/components/assessment-editor";
import {
  assessmentToYaml,
  yamlToAssessmentGroups
} from "@/features/editor/lib/yaml-mapper";
import type { QuestionGroupRequest } from "@/features/questionsets/api/questionset-api";
import { SaveAsDialog } from "@/features/hierarchy/components/save-as-dialog";

import { useDocumentTitle } from "@/shared/hooks/use-document-title"

export function ExamEditorPage() {
  const { examId } = useParams<{ classroomId: string; examId: string }>()
  const queryClient = useQueryClient();
  const [saveAsOpen, setSaveAsOpen] = useState(false);

  const { data: detail, isLoading, error } = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => getExamDetail(examId!),
    enabled: !!examId,
  });

  useDocumentTitle(detail ? `Edit: ${detail.title}` : "Edit Exam")

  const initialYaml = useMemo(() => {
    if (!detail || !detail.questionGroups) return "";
    return assessmentToYaml(detail.questionGroups as unknown as QuestionGroupRequest[]);
  }, [detail]);

  const saveMutation = useMutation({
    mutationFn: async (yaml: string) => {
      if (!examId) return;
      const questionGroups = await yamlToAssessmentGroups(yaml);
      await updateExamQuestions(examId, questionGroups);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exam", examId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        Error loading exam: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="@container/main flex flex-1 flex-col min-h-0 px-4 lg:px-6 py-4 md:py-6">
        <AssessmentEditor
          key={examId}
          initialYaml={initialYaml}
          onSave={saveMutation.mutateAsync}
          isSaving={saveMutation.isPending}
          successMessage="Exam questions saved successfully"
          restricted={true}
          onSaveAs={() => setSaveAsOpen(true)}
          sourceType="EXAM"
        />
        {saveAsOpen && detail && (
          <SaveAsDialog
            open={saveAsOpen}
            onOpenChange={setSaveAsOpen}
            sourceId={examId!}
            sourceType="EXAM"
            sourceName={detail.title}
          />
        )}
      </div>
    </div>
  )
}
