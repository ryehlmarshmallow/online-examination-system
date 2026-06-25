import { AssessmentEditor } from "@/features/editor/components/assessment-editor";
import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import {
  useParams,
  useLocation,
  useNavigate
} from "react-router-dom";
import {
  getPoolDetail,
  getTemplateDetail,
  updatePoolQuestions,
  updateTemplateQuestions
} from "../api/questionset-api";
import {
  useMemo,
  useEffect,
  useState
} from "react";
import { AlertCircleIcon } from "lucide-react";
import { SaveAsDialog } from "@/features/hierarchy/components/save-as-dialog";
import { DeployExamDialog } from "@/features/hierarchy/components/deploy-exam-dialog";
import { Spinner } from "@/shared/components/ui/spinner";
import { hierarchyApi } from "@/features/hierarchy/api/hierarchy-api";
import { Button } from "@/shared/components/ui/button";
import {
  assessmentToYaml,
  yamlToAssessmentGroups
} from "@/features/editor/lib/yaml-mapper";

import { useDocumentTitle } from "@/shared/hooks/use-document-title"

export function QuestionSetEditorPage() {
  const { poolId, templateId } = useParams();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const isPool = location.pathname.startsWith("/pools");
  const id = isPool ? poolId : templateId;
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);

  const { data: detail, isLoading, error } = useQuery({
    queryKey: ["questionset", id],
    queryFn: () => isPool ? getPoolDetail(id!) : getTemplateDetail(id!),
    enabled: !!id,
    retry: false, // Don't retry if it's likely a type mismatch
  });

  useDocumentTitle(
    detail
      ? `${isPool ? "Pool" : "Template"}: ${detail.name}`
      : isPool
        ? "Edit Pool"
        : "Edit Template"
  )

  // Probe for type if error occurs to handle folder-as-file case
  const { data: breadcrumb } = useQuery({
    queryKey: ["breadcrumb-probe", isPool ? "POOL" : "TEMPLATE", id],
    queryFn: () => hierarchyApi.getBreadcrumb(isPool ? "POOL" : "TEMPLATE", id!),
    enabled: !!error && !!id,
  });

  useEffect(() => {
    if (breadcrumb && breadcrumb.length > 0) {
      const currentNode = breadcrumb[breadcrumb.length - 1];
      if (currentNode.id === id && currentNode.nodeType === 'FOLDER') {
        const rootUrl = isPool ? "/pools" : "/templates";
        navigate(`${rootUrl}/f/${id}`, { replace: true });
      }
    }
  }, [breadcrumb, id, isPool, navigate]);

  const initialYaml = useMemo(() => {
    if (!detail || !detail.questionGroups) return "";
    return assessmentToYaml(detail.questionGroups);
  }, [detail]);

  const saveMutation = useMutation({
    mutationFn: async (yaml: string) => {
      if (!id) return;
      const questionGroups = await yamlToAssessmentGroups(yaml);

      if (isPool) {
        await updatePoolQuestions(id, questionGroups);
      } else {
        await updateTemplateQuestions(id, questionGroups);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["questionset", id] });
    },
    onError: () => {
    }
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
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <AlertCircleIcon className="h-12 w-12 text-destructive" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Failed to load question set</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {(error as Error).message}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="@container/main flex flex-1 flex-col min-h-0 px-4 lg:px-6 py-4 md:py-6">
        <AssessmentEditor
          key={id}
          initialYaml={initialYaml}
          onSave={saveMutation.mutateAsync}
          isSaving={saveMutation.isPending}
          successMessage="Question set saved successfully"
          onSaveAs={() => setSaveAsOpen(true)}
          onDeploy={() => setDeployOpen(true)}
          sourceType={isPool ? "POOL" : "TEMPLATE"}
        />
        {saveAsOpen && detail && (
          <SaveAsDialog
            open={saveAsOpen}
            onOpenChange={setSaveAsOpen}
            sourceId={id!}
            sourceType={isPool ? "POOL" : "TEMPLATE"}
            sourceName={detail.name}
          />
        )}
        {deployOpen && detail && (
          <DeployExamDialog
            open={deployOpen}
            onOpenChange={setDeployOpen}
            sourceId={id!}
            sourceType={isPool ? "POOL" : "TEMPLATE"}
            sourceName={detail.name}
          />
        )}
      </div>
    </div>
  )
}
