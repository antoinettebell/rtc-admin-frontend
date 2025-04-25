import { useEffect, useState } from "react"

export function useIsMobile(breakpoint: number = 768) {
  // Default to false for SSR
  const [isMobile, setIsMobile] = useState(false)
  
  // Only run on client-side
  useEffect(() => {
    // Skip if window is not available (SSR)
    if (typeof window === 'undefined') return
    
    // Function to check if mobile
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }
    
    // Initial check
    checkIsMobile()
    
    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile)
    
    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [breakpoint])
  
  return isMobile
} 