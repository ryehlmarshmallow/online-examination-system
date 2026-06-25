import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  FileIcon,
  MoreVerticalIcon,
  Loader2Icon,
  DownloadIcon,
  Trash2Icon,
  UploadCloudIcon,
} from "lucide-react"
import type {
  ExamQuestion,
  FileDetails
} from "../../types/exam"

interface FileQuestionProps {
  question: ExamQuestion
  answers: Record<string, unknown>
  isReadOnly: boolean
  deletingFiles: Set<string>
  isUploading: boolean
  onFileUpload: (questionId: string, files: FileList | null) => void
  onDeleteFile: (questionId: string, fileId: string) => void
  onDownloadFile: (fileId: string, originalFilename: string) => void
}

export function FileQuestion({
                               question,
                               answers,
                               isReadOnly,
                               deletingFiles,
                               isUploading,
                               onFileUpload,
                               onDeleteFile,
                               onDownloadFile
                             }: FileQuestionProps) {
  const currentAnswer = answers[question.id!] as { files?: FileDetails[] } | undefined
  const files = currentAnswer?.files || []

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {files.map((file) => (
          <div key={file.fileId} className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm truncate">{file.originalFilename}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={deletingFiles.has(file.fileId)}>
                  {deletingFiles.has(file.fileId) ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVerticalIcon className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => onDownloadFile(file.fileId, file.originalFilename)}
                                  className="flex items-center">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  <span>Download</span>
                </DropdownMenuItem>
                {!isReadOnly && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive flex items-center"
                    onClick={() => onDeleteFile(question.id!, file.fileId)}
                  >
                    <Trash2Icon className="h-4 w-4 mr-2" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        {files.length === 0 && (
          <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-sm">
            No files uploaded yet.
          </div>
        )}
      </div>

      {!isReadOnly && (
        <div
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl hover:bg-accent/50 transition-colors">
          <Input
            aria-label="File Upload"
            type="file"
            multiple
            className="hidden"
            id={`file-upload-${question.id}`}
            onChange={(e) => onFileUpload(question.id!, e.target.files)}
            disabled={isUploading}
          />
          <Label
            htmlFor={`file-upload-${question.id}`}
            className={cn(
              "flex flex-col items-center gap-2 cursor-pointer",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <div className="p-3 bg-primary/10 rounded-full">
              {isUploading ? (
                <Loader2Icon className="h-6 w-6 text-primary animate-spin" />
              ) : (
                <UploadCloudIcon className="h-6 w-6 text-primary" />
              )}
            </div>
            <span className="font-medium text-sm">
              {isUploading ? "Uploading files..." : "Click to upload files"}
            </span>
            <span className="text-xs text-muted-foreground">Multiple files allowed</span>
          </Label>
        </div>
      )}
    </div>
  )
}
