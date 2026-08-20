"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "@/lib/countries";

interface CountryContextValue {
  country: Country;
  setCountry: (code: string) => void;
}

const CountryContext = createContext<CountryContextValue>({
  country: DEFAULT_COUNTRY,
  setCountry: () => {},
});

export function useCountry() {
  return useContext(CountryContext);
}

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<Country>(DEFAULT_COUNTRY);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = localStorage.getItem("country");
    if (saved) {
      const found = COUNTRIES.find((c) => c.code === saved);
      if (found) setCountryState(found);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setCountry = useCallback((code: string) => {
    const found = COUNTRIES.find((c) => c.code === code);
    if (found) {
      setCountryState(found);
      localStorage.setItem("country", code);
    }
  }, []);

  return (
    <CountryContext.Provider value={{ country, setCountry }}>
      {children}
    </CountryContext.Provider>
  );
}
