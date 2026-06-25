import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import type { NodeResponse } from "../types/hierarchy"

interface RenameNodeDialogProps {
  node: NodeResponse | null
  onClose: () => void
  onSubmit: (name: string) => void
  isLoading?: boolean
}

export function RenameNodeDialog({
                                   node,
                                   onClose,
                                   onSubmit,
                                   isLoading,
                                 }: RenameNodeDialogProps) {
  const [name, setName] = useState("")
  const [prevNode, setPrevNode] = useState(node)

  if (node !== prevNode) {
    setPrevNode(node)
    setName(node ? node.name : "")
  }

  const handleSubmit = () => {
    if (name.trim() && node && name.trim() !== node.name) {
      onSubmit(name.trim())
      onClose()
    } else if (node && name.trim() === node.name) {
      onClose()
    }
  }

  return (
    <Dialog open={!!node} onOpenChange={(open) => {
      if (!open) onClose()
    }}>
      <DialogTrigger className="hidden" />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Item</DialogTitle>
          <DialogDescription>
            Enter a new name for this {node?.nodeType === "FOLDER" ? "folder" : "item"}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              id="rename-node-name"
              aria-label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  handleSubmit()
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
