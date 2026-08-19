"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useState } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={toggleTheme}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-paper-dark/90 backdrop-blur-md border border-[rgba(0,0,0,0.1)] shadow-lg flex items-center justify-center text-ink-medium hover:text-accent-warm hover:border-accent-warm/50 hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun size={18} strokeWidth={1.8} />
      ) : (
        <Moon size={18} strokeWidth={1.8} />
      )}

      {hovered && (
        <div className="absolute bottom-full mb-3 px-3 py-1.5 bg-ink-dark text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
          {theme === "dark" ? "Switch to light" : "Switch to dark"}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ink-dark" />
        </div>
      )}
    </button>
  );
}
