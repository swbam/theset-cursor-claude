"use client";

import { ReactNode, useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SwipeTabsProps {
  defaultValue: string;
  tabs: {
    value: string;
    label: string;
    content: ReactNode;
  }[];
  className?: string;
}

export function SwipeTabs({ defaultValue, tabs, className }: SwipeTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      setTouchEndX(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (!touchStartX || !touchEndX) return;

      const distance = touchStartX - touchEndX;
      const isSwipe = Math.abs(distance) > 50; // Minimum swipe distance

      if (isSwipe) {
        const currentIndex = tabs.findIndex((tab) => tab.value === activeTab);

        if (distance > 0 && currentIndex < tabs.length - 1) {
          // Swipe left - go to next tab
          setActiveTab(tabs[currentIndex + 1].value);
        } else if (distance < 0 && currentIndex > 0) {
          // Swipe right - go to previous tab
          setActiveTab(tabs[currentIndex - 1].value);
        }
      }

      // Reset values
      setTouchStartX(null);
      setTouchEndX(null);
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [activeTab, tabs, touchStartX, touchEndX]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className={className}
    >
      <TabsList className="w-full mb-4">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
