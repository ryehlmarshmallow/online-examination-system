import { useEffect } from "react"

/**
 * A hook to dynamically update the document (browser tab) title.
 *
 * @param title - The page-specific title to set.
 * @param includeSuffix - Whether to append the site name suffix. Defaults to true.
 */
export function useDocumentTitle(title: string, includeSuffix = true) {
  useEffect(() => {
    const suffix = "Online Examination System"
    document.title = includeSuffix && title ? `${title} | ${suffix}` : title || suffix
  }, [title, includeSuffix])
}
