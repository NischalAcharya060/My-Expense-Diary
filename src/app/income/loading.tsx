export default function IncomeLoading() {
  return (
    <div className="notebook-paper min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b border-[rgba(0,0,0,0.06)] pb-4">
            <div className="space-y-2">
              <div className="h-8 w-32 bg-paper-dark rounded" />
              <div className="h-3 w-48 bg-paper-dark rounded" />
            </div>
            <div className="h-10 w-32 bg-paper-dark rounded-lg" />
          </div>
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 p-3 rounded-lg">
            <div className="h-10 flex-1 bg-paper-dark rounded-md" />
            <div className="h-10 w-full sm:w-40 bg-paper-dark rounded-md" />
          </div>
          {/* Income entries */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="paper-card px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-paper-dark shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-40 bg-paper-dark rounded" />
                <div className="h-2.5 w-24 bg-paper-dark rounded" />
              </div>
              <div className="h-4 w-20 bg-paper-dark rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
