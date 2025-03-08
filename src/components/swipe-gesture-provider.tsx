"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

interface SwipeGestureContextType {
  handleSwipeLeft: () => void;
  handleSwipeRight: () => void;
}

const SwipeGestureContext = createContext<SwipeGestureContextType | undefined>(
  undefined
);

export function useSwipeGestures() {
  const context = useContext(SwipeGestureContext);
  if (!context) {
    throw new Error(
      "useSwipeGestures must be used within a SwipeGestureProvider"
    );
  }
  return context;
}

interface SwipeGestureProviderProps {
  children: ReactNode;
}

export function SwipeGestureProvider({ children }: SwipeGestureProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Navigation paths for swipe gestures
  const navigationPaths = [
    "/",
    "/artist",
    "/shows",
    "/my/artists",
    "/my/setlists",
  ];

  // Find current index in navigation paths
  const currentIndex = navigationPaths.findIndex(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const handleSwipeLeft = () => {
    if (currentIndex < navigationPaths.length - 1 && currentIndex !== -1) {
      router.push(navigationPaths[currentIndex + 1]);
    }
  };

  const handleSwipeRight = () => {
    if (currentIndex > 0) {
      router.push(navigationPaths[currentIndex - 1]);
    }
  };

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartX(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      setTouchEndX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (!touchStartX || !touchEndX) return;

      const distance = touchStartX - touchEndX;
      const isSwipe = Math.abs(distance) > 50; // Minimum swipe distance

      if (isSwipe) {
        if (distance > 0) {
          // Swipe left
          handleSwipeLeft();
        } else {
          // Swipe right
          handleSwipeRight();
        }
      }

      // Reset values
      setTouchStartX(null);
      setTouchEndX(null);
    };

    // Only add touch events on mobile devices
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      document.addEventListener("touchstart", handleTouchStart);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      if (isMobile) {
        document.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [touchStartX, touchEndX, currentIndex]);

  return (
    <SwipeGestureContext.Provider value={{ handleSwipeLeft, handleSwipeRight }}>
      {children}
    </SwipeGestureContext.Provider>
  );
}
