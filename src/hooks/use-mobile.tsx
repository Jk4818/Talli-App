import * as React from "react"

const MOBILE_BREAKPOINT = 768

// This hook now returns `undefined` on the server, and a boolean on the client.
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Set the value on the client
    setIsMobile(mql.matches)

    const listener = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    mql.addEventListener("change", listener)

    return () => {
      mql.removeEventListener("change", listener)
    }
  }, [])

  return isMobile
}
