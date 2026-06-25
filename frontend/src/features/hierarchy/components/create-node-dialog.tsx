import {
  type ReactNode,
  useState
} from "react"
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
import { useDisclosure } from "@/shared/hooks/use-disclosure"

interface CreateNodeDialogProps {
  title: string
  description: string
  placeholder?: string
  onSubmit: (name: string) => void
  isLoading?: boolean
  trigger: ReactNode
}

export function CreateNodeDialog({
                                   title,
                                   description,
                                   placeholder = "e.g. My Folder",
                                   onSubmit,
                                   isLoading,
                                   trigger,
                                 }: CreateNodeDialogProps) {
  const { isOpen, onOpen, onClose, setIsOpen } = useDisclosure()
  const [name, setName] = useState("")

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim())
      onClose()
    }
  }

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (!isOpen) {
      setName("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={onOpen}>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              id="node-name"
              aria-label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
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
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
