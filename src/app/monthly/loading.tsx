export default function MonthlyLoading() {
  return (
    <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-paper-dark rounded" />
        <div className="flex items-center justify-between mt-4">
          <div className="h-8 w-32 bg-paper-dark rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-paper-dark rounded" />
            <div className="h-8 w-8 bg-paper-dark rounded" />
          </div>
        </div>
        <div className="h-32 bg-paper-dark rounded-lg mt-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-paper-dark rounded-lg" />
          ))}
        </div>
        <div className="h-48 bg-paper-dark rounded-lg mt-4" />
      </div>
    </div>
  );
}
