export default function ExpensesLoading() {
  return (
    <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-[rgba(0,0,0,0.06)] pb-4">
          <div className="space-y-2">
            <div className="shimmer h-9 w-48 rounded" />
            <div className="shimmer h-3 w-56 rounded" />
          </div>
          <div className="shimmer h-10 w-32 rounded-lg" />
        </div>

        {/* Search & filter bar */}
        <div className="mb-6 p-3 rounded-lg bg-paper-dark/30 border border-[rgba(0,0,0,0.04)] space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="shimmer h-10 flex-1 rounded-md" />
            <div className="shimmer h-10 w-full sm:w-36 rounded-md" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[64, 52, 76, 60, 68].map((w, i) => (
              <div key={i} className="shimmer h-6 rounded-full" style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* Journal rows grouped by day */}
        {[1, 2].map((day) => (
          <div key={day} className="mb-6">
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className="shimmer h-6 w-40 rounded" />
              <span className="dots" />
              <div className="shimmer h-6 w-16 rounded" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="paper-card px-4 py-3 flex items-center gap-3 border-l-4 border-l-paper-dark"
                >
                  <div className="shimmer w-7 h-7 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div
                      className="shimmer h-3.5 rounded"
                      style={{ width: `${45 + ((day * 13 + row * 17) % 25)}%` }}
                    />
                    <div className="shimmer h-2.5 w-1/4 rounded" />
                  </div>
                  <div className="shimmer h-4 w-14 rounded shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
