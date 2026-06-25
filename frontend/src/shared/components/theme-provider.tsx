import {
  useEffect,
  useState
} from "react"
import type { ReactNode } from "react"
import {
  type Theme,
  ThemeProviderContext,
  type ThemeProviderState
} from "./theme-context"

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

const getResolvedTheme = (theme: Theme): "dark" | "light" => {
  if (theme !== "system") return theme
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({
                                children,
                                defaultTheme = "system",
                                storageKey = "vite-ui-theme",
                                ...props
                              }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() => getResolvedTheme(theme))

  useEffect(() => {
    const root = window.document.documentElement

    const updateTheme = () => {
      root.classList.remove("light", "dark")
      const currentResolvedTheme = getResolvedTheme(theme)
      root.classList.add(currentResolvedTheme)
      setResolvedTheme(currentResolvedTheme)
    }

    updateTheme()

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => updateTheme()
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme])

  const setTheme = (nextTheme: Theme) => {
    localStorage.setItem(storageKey, nextTheme)
    setThemeState(nextTheme)
  }

  const value: ThemeProviderState = {
    theme,
    setTheme,
    resolvedTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
