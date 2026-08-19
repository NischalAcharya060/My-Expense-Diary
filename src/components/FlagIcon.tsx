"use client";

import { getFlagUrl } from "@/lib/countries";

interface Props {
  code: string;
  size?: number;
  className?: string;
}

export default function FlagIcon({ code, size = 20, className = "" }: Props) {
  return (
    <img
      src={getFlagUrl(code)}
      alt=""
      width={size}
      height={Math.round(size * 0.75)}
      className={`rounded-sm object-cover ${className}`}
      loading="lazy"
    />
  );
}
