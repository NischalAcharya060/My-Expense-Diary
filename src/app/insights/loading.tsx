export default function InsightsLoading() {
  return (
    <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="mb-6 border-b border-[rgba(0,0,0,0.06)] pb-4">
          <div className="shimmer h-9 w-56 rounded" />
          <div className="shimmer h-3 w-40 rounded mt-2" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="paper-card p-4">
              <div className={`shimmer h-2.5 rounded mb-2 ${["w-14", "w-12", "w-16", "w-10"][i - 1]}`} />
              <div className="shimmer h-6 w-full max-w-[80px] rounded" />
            </div>
          ))}
        </div>

        {/* Pie chart + legend outline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="paper-card p-6">
            <div className="shimmer h-5 w-36 rounded mb-4" />
            <div className="flex items-center gap-8">
              <div
                className="w-36 h-36 rounded-full shrink-0 animate-pulse"
                style={{
                  border: "16px solid var(--paper-dark)",
                  borderRightColor: "rgba(0,0,0,0.06)",
                  borderBottomColor: "var(--accent-warm)",
                  opacity: 0.7,
                }}
                aria-hidden="true"
              />
              <div className="flex-1 space-y-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${i === 3 ? "bg-accent-warm/60" : "bg-paper-dark"}`}
                      aria-hidden="true"
                    />
                    <div className={`shimmer h-3 rounded ${["w-3/4", "w-2/3", "w-4/5", "w-1/2"][i - 1]}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar chart outline */}
          <div className="paper-card p-6">
            <div className="shimmer h-5 w-32 rounded mb-4" />
            <div className="h-44 flex items-end justify-around gap-3 px-2 border-b border-[rgba(0,0,0,0.06)] pb-px">
              {[45, 70, 35, 85, 55, 65, 30].map((h, i) => (
                <div key={i} className="shimmer flex-1 rounded-t max-w-[38px]" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-2 px-2">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className="shimmer h-2 w-6 rounded" aria-label={d} />
              ))}
            </div>
          </div>
        </div>

        {/* Area/trend chart outline */}
        <div className="paper-card p-6">
          <div className="shimmer h-5 w-44 rounded mb-4" />
          <svg
            viewBox="0 0 400 120"
            className="w-full h-36"
            preserveAspectRatio="none"
            role="img"
            aria-label="Chart loading"
          >
            <g opacity="0.25">
              <line x1="0" y1="30" x2="400" y2="30" stroke="var(--ink-light)" strokeWidth="1" strokeDasharray="4 6" />
              <line x1="0" y1="60" x2="400" y2="60" stroke="var(--ink-light)" strokeWidth="1" strokeDasharray="4 6" />
              <line x1="0" y1="90" x2="400" y2="90" stroke="var(--ink-light)" strokeWidth="1" strokeDasharray="4 6" />
            </g>
            <path
              d="M0,92 C50,78 80,96 130,72 C180,50 215,84 265,58 C315,36 360,52 400,40 L400,120 L0,120 Z"
              fill="var(--accent-warm)"
              fillOpacity="0.08"
            />
            <path
              className="animate-pulse"
              d="M0,92 C50,78 80,96 130,72 C180,50 215,84 265,58 C315,36 360,52 400,40"
              fill="none"
              stroke="var(--accent-warm)"
              strokeOpacity="0.45"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
