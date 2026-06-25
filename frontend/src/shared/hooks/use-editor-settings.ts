import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditorSettings {
  theme: string;
  fontSize: number;
  lineWrapping: boolean;
  setTheme: (theme: string) => void;
  setFontSize: (size: number) => void;
  setLineWrapping: (wrap: boolean) => void;
  reset: () => void;
}

export const useEditorSettings = create<EditorSettings>()(
  persist(
    (set) => ({
      theme: 'system',
      fontSize: 15,
      lineWrapping: true,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLineWrapping: (lineWrapping) => set({ lineWrapping }),
      reset: () => set({ theme: 'system', fontSize: 15, lineWrapping: true }),
    }),
    {
      name: 'editor-settings',
    }
  )
);
