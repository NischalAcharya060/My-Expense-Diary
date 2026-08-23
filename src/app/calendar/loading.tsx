export default function CalendarLoading() {
  return (
    <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        {/* Header + month nav */}
        <div className="flex items-center justify-between mb-6 border-b border-[rgba(0,0,0,0.06)] pb-4">
          <div className="shimmer h-9 w-52 rounded" />
          <div className="flex gap-2">
            <div className="shimmer h-9 w-9 rounded-lg" />
            <div className="shimmer h-9 w-9 rounded-lg" />
          </div>
        </div>

        {/* Month total */}
        <div className="shimmer h-6 w-40 rounded mb-5" />

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-5 bg-paper-dark/70 rounded mx-0.5" />
          ))}
        </div>

        {/* Calendar grid with pulsing day cells */}
        <div className="grid grid-cols-7 gap-1.5 animate-pulse" role="img" aria-label="Calendar loading">
          {Array.from({ length: 35 }, (_, i) => (
            <div
              key={i}
              className={`h-16 sm:h-20 rounded-lg p-1.5 flex flex-col justify-between ${
                i % 2 === 0 ? "bg-paper-dark/50" : "bg-paper-dark/35"
              } ${i === 10 ? "ring-2 ring-accent-warm/30" : ""}`}
            >
              <div className="w-full h-full flex flex-col justify-between">
                <div className="shimmer h-2 w-3.5 rounded-sm" />
                <div className="flex gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${i % 3 === 0 ? "bg-accent-warm/40" : "bg-paper-line"}`} />
                  {i % 4 === 0 && <span className="w-1.5 h-1.5 rounded-full bg-accent-green/30" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
