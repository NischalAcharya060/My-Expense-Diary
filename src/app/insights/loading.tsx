export default function InsightsLoading() {
  return (
    <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-paper-dark rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-paper-dark rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="h-64 bg-paper-dark rounded-lg" />
          <div className="h-64 bg-paper-dark rounded-lg" />
        </div>
        <div className="h-48 bg-paper-dark rounded-lg mt-4" />
      </div>
    </div>
  );
}
