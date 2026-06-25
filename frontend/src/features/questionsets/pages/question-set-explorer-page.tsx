import {
  useParams,
  useLocation
} from "react-router-dom"
import { ResourceExplorer } from "../../hierarchy/components/resource-explorer"
import { useDocumentTitle } from "@/shared/hooks/use-document-title"

export function QuestionSetExplorerPage() {
  const { folderId } = useParams<{ folderId?: string }>()
  const location = useLocation()
  const isPool = location.pathname.startsWith("/pools")

  useDocumentTitle(isPool ? "Pools" : "Templates")

  return (
    <ResourceExplorer
      domain={isPool ? "POOL" : "TEMPLATE"}
      parentId={folderId ?? null}
      itemLabel={isPool ? "Pool" : "Template"}
    />
  )
}
