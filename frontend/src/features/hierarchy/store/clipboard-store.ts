import { create } from "zustand"
import type {
  NodeType,
  DomainType
} from "../types/hierarchy"

export type ClipboardItem = {
  id: string
  name: string
  nodeType: NodeType
}

export type ClipboardAction = "COPY" | "CUT" | null

type ClipboardState = {
  items: ClipboardItem[]
  action: ClipboardAction
  domain: DomainType | null
  copy: (domain: DomainType, items: ClipboardItem[]) => void
  cut: (domain: DomainType, items: ClipboardItem[]) => void
  clear: () => void
}

export const useClipboardStore = create<ClipboardState>((set) => ({
  items: [],
  action: null,
  domain: null,
  copy: (domain, items) => set({ domain, items, action: "COPY" }),
  cut: (domain, items) => set({ domain, items, action: "CUT" }),
  clear: () => set({ domain: null, items: [], action: null }),
}))
