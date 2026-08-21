export default function CategoriesLoading() {
  return (
    <div className="notebook-paper min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="h-8 w-40 bg-paper-dark rounded" />
              <div className="h-3 w-56 bg-paper-dark rounded" />
            </div>
            <div className="h-10 w-36 bg-paper-dark rounded-lg" />
          </div>
          {/* Category cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="paper-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-paper-dark shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-28 bg-paper-dark rounded" />
                  <div className="h-2.5 w-20 bg-paper-dark rounded" />
                </div>
                <div className="flex gap-1.5">
                  <div className="w-7 h-7 bg-paper-dark rounded" />
                  <div className="w-7 h-7 bg-paper-dark rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
