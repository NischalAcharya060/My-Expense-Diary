"use client";

import { useState } from "react";
import { getFlagUrl } from "@/lib/countries";

interface Props {
  code: string;
  size?: number;
  className?: string;
}

export default function FlagIcon({ code, size = 20, className = "" }: Props) {
  const [error, setError] = useState(false);

  if (error || !code) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-sm bg-paper-dark text-ink-light font-bold ${className}`}
        style={{ width: size, height: Math.round(size * 0.75), fontSize: size * 0.45 }}
      >
        {code?.toUpperCase() || "?"}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- flag CDN image
    <img
      src={getFlagUrl(code)}
      alt={`${code} flag`}
      width={size}
      height={Math.round(size * 0.75)}
      className={`rounded-sm object-cover ${className}`}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}
