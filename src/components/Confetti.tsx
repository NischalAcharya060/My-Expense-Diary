"use client";

import { useEffect, useState } from "react";

const COLORS = ["#D4854A", "#4A8C6F", "#C45C5C", "#5C7CC4", "#E8B84A"];

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  round: boolean;
}

export default function Confetti({ pieceCount = 60 }: { pieceCount?: number }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect -- random layout must be generated client-side after mount */
  useEffect(() => {
    setPieces(
      Array.from({ length: pieceCount }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.2 + Math.random() * 1.8,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
        round: Math.random() > 0.7,
      }))
    );
  }, [pieceCount]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (pieces.length === 0) return null;

  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden pointer-events-none z-[90]">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            borderRadius: p.round ? "50%" : 2,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
