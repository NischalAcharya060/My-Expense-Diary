"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Check, Search, PartyPopper } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useCountry } from "@/components/CountryProvider";
import FlagIcon from "@/components/FlagIcon";
import { COUNTRIES } from "@/lib/countries";
import { useExpenses, useCategories } from "@/lib/store";
import { getToday, getCurrencySymbol, formatCurrency } from "@/lib/utils";
import type { Category } from "@/types";

const STEPS = ["Welcome", "Currency", "First Expense"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, isConfigured, completeOnboarding } = useAuth();
  const { country, setCountry } = useCountry();
  const { addExpense } = useExpenses();
  const { categories } = useCategories();

  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const onboarded = !!user?.user_metadata?.onboarded;

  useEffect(() => {
    if (user && onboarded) router.replace("/");
  }, [user, onboarded, router]);

  const filteredCountries = useMemo(
    () =>
      COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.currency.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const finish = async () => {
    await completeOnboarding();
    router.replace("/");
  };

  const handleSaveExpense = async () => {
    const value = parseFloat(amount);
    if (!name.trim() || !value || value <= 0) return;
    setSaving(true);
    try {
      await addExpense({
        name: name.trim(),
        amount: value,
        category,
        date: getToday(),
        payment_method: "Cash",
        expense_type: "Daily purchase",
        note: "",
      });
      setSaved(true);
      await completeOnboarding();
    } finally {
      setSaving(false);
    }
  };

  if (loading || (user && onboarded)) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse max-w-lg mx-auto space-y-4 mt-16">
          <div className="h-10 w-64 bg-paper-dark rounded mx-auto" />
          <div className="h-48 bg-paper-dark rounded" />
        </div>
      </div>
    );
  }

  if (!isConfigured || !user) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="max-w-md mx-auto text-center mt-20 paper-card p-10">
          <span className="text-5xl block mb-3">📓</span>
          <h1 className="font-handwritten text-3xl text-ink-dark mb-2">Almost there!</h1>
          <p className="text-sm text-ink-medium mb-6">Sign in to set up your expense diary.</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-warm text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            Sign in with Google
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="notebook-paper min-h-screen p-4 sm:p-8 pt-16 lg:pl-20 page-enter">
      <div className="max-w-lg mx-auto pt-6 sm:pt-12">

        {/* Progress */}
        {!saved && (
          <div className="flex items-center justify-center gap-2 mb-8" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i < step
                      ? "bg-accent-green text-white"
                      : i === step
                        ? "bg-accent-warm text-white"
                        : "bg-paper-dark text-ink-light border border-[rgba(0,0,0,0.06)]"
                  }`}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </span>
                <span className={`text-xs font-semibold hidden sm:inline ${i === step ? "text-ink-dark" : "text-ink-light"}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && <span className="w-6 h-px bg-[rgba(0,0,0,0.1)]" />}
              </div>
            ))}
          </div>
        )}

        {/* Step 1 — Welcome */}
        {step === 0 && (
          <div className="text-center">
            <div className="animate-floaty text-7xl mb-4" aria-hidden="true">📓</div>
            <h1 className="font-handwritten text-4xl sm:text-5xl text-ink-dark mb-3 leading-tight">
              Welcome to My Expense Diary
            </h1>
            <p className="text-sm text-ink-medium leading-relaxed max-w-sm mx-auto mb-8">
              Track your spending like writing in a cozy paper journal — quick entries, bills that never slip by, and notes for everything else.
            </p>

            {/* Animated app preview */}
            <div className="paper-card p-5 max-w-sm mx-auto mb-8 rotate-[-1.5deg] hover:rotate-0 transition-transform duration-300 relative shadow-lg">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-200/20 border border-amber-300/10 rotate-1 shadow-sm rounded-sm pointer-events-none" />
              <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-2 mb-3">
                <span className="font-handwritten text-xl text-ink-dark">{format(new Date(), "EEEE, MMMM d")}</span>
                <span className="text-xs text-ink-light font-bold uppercase tracking-wider">$82.00</span>
              </div>
              <div className="space-y-2 text-left">
                <div className="handwritten-entry flex items-baseline !pl-3 opacity-90">
                  <span className="mr-1.5">☕</span><span className="text-ink-dark">Morning coffee</span>
                  <span className="dots" /><span className="amount font-bold text-accent-warm">$4.50</span>
                </div>
                <div className="handwritten-entry flex items-baseline !pl-3 opacity-70">
                  <span className="mr-1.5">🛒</span><span className="text-ink-dark">Groceries</span>
                  <span className="dots" /><span className="amount font-bold text-accent-warm">$63.50</span>
                </div>
                <div className="handwritten-entry flex items-baseline !pl-3 opacity-40">
                  <span className="mr-1.5">🎬</span><span className="text-ink-dark">Cinema ticket</span>
                  <span className="dots" /><span className="amount font-bold text-accent-warm">$12.00</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="px-8 py-3 bg-accent-warm text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Get Started →
            </button>
            <button
              onClick={finish}
              className="block mx-auto mt-4 text-xs text-ink-light hover:text-ink-medium underline underline-offset-2 cursor-pointer"
            >
              Skip setup
            </button>
          </div>
        )}

        {/* Step 2 — Currency */}
        {step === 1 && (
          <div>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3" aria-hidden="true"><FlagIcon code={country.code} size={44} /></div>
              <h1 className="font-handwritten text-4xl text-ink-dark mb-2">Pick your currency</h1>
              <p className="text-sm text-ink-medium">
                Currently: <strong>{country.symbol} {country.currency}</strong> — amounts everywhere will use this symbol.
              </p>
            </div>

            <div className="paper-card p-4">
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country or currency..."
                  className="w-full pl-9 pr-3 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark placeholder:text-ink-light/60 focus:outline-none focus:border-accent-warm"
                  aria-label="Search country or currency"
                />
              </div>
              <div className="overflow-y-auto max-h-72 rounded border border-[rgba(0,0,0,0.04)]">
                {filteredCountries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => { setCountry(c.code); }}
                    className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 transition-colors cursor-pointer ${
                      c.code === country.code ? "bg-accent-warm/10 text-accent-warm font-semibold" : "text-ink-dark hover:bg-paper-dark/40"
                    }`}
                  >
                    <FlagIcon code={c.code} size={20} />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-xs text-ink-light shrink-0">{c.symbol} · {c.currency}</span>
                    {c.code === country.code && <Check size={15} className="shrink-0" />}
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <p className="px-3 py-6 text-sm text-ink-light text-center">No countries found</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setStep(0)}
                className="text-xs text-ink-light hover:text-ink-medium underline underline-offset-2 cursor-pointer"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-8 py-3 bg-accent-warm text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — First expense */}
        {step === 2 && (
          <div>
            {saved ? (
              <div className="text-center page-enter">
                <div className="animate-floaty inline-block mb-4" aria-hidden="true"><PartyPopper size={56} className="text-accent-warm" /></div>
                <h1 className="font-handwritten text-4xl text-ink-dark mb-2">Your diary is officially started!</h1>
                <p className="text-sm text-ink-medium mb-8">
                  You logged <strong className="amount">{formatCurrency(parseFloat(amount) || 0)}</strong> for &ldquo;{name.trim()}&rdquo;. That&apos;s the whole ritual — name, amount, done.
                </p>
                <button
                  onClick={() => router.replace("/")}
                  className="px-8 py-3 bg-accent-warm text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Go to my diary →
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3 animate-floaty" aria-hidden="true">✍️</div>
                  <h1 className="font-handwritten text-4xl text-ink-dark mb-2">Log your first expense</h1>
                  <p className="text-sm text-ink-medium">It takes 10 seconds. Try a coffee you bought today.</p>
                </div>

                <div className="paper-card p-6 space-y-4">
                  <div>
                    <label htmlFor="ob-name" className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">What did you buy?</label>
                    <input
                      id="ob-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Morning coffee"
                      maxLength={200}
                      className="w-full px-3 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark placeholder:text-ink-light/60 focus:outline-none focus:border-accent-warm"
                    />
                  </div>
                  <div>
                    <label htmlFor="ob-amount" className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">How much?</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light text-sm">{getCurrencySymbol()}</span>
                      <input
                        id="ob-amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-3 py-2.5 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-sm text-ink-dark placeholder:text-ink-light/60 focus:outline-none focus:border-accent-warm amount"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs text-ink-light uppercase tracking-wide mb-1.5">Category</span>
                    <div className="flex flex-wrap gap-1.5">
                      {categories.slice(0, 8).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setCategory(c.name as Category)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                            category === c.name
                              ? "text-white border-transparent"
                              : "text-ink-dark border-[rgba(0,0,0,0.1)] hover:bg-paper-dark/40"
                          }`}
                          style={category === c.name ? { backgroundColor: c.color } : undefined}
                        >
                          {c.icon} {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-ink-light pt-1 border-t border-[rgba(0,0,0,0.05)]">
                    📅 Dated today ({format(new Date(), "MMM d")}) · paid with Cash — you can change both when editing.
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-ink-light hover:text-ink-medium underline underline-offset-2 cursor-pointer"
                  >
                    ← Back
                  </button>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={finish}
                      className="text-xs text-ink-light hover:text-ink-medium underline underline-offset-2 cursor-pointer"
                    >
                      Skip for now
                    </button>
                    <button
                      onClick={handleSaveExpense}
                      disabled={!name.trim() || !parseFloat(amount) || parseFloat(amount) <= 0 || saving}
                      className="px-8 py-3 bg-accent-warm text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
                    >
                      {saving ? "Saving..." : "Save it! ✨"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
