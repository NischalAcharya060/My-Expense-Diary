export default function BillsLoading() {
  return (
    <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-paper-dark rounded" />
        <div className="flex gap-3 mt-4">
          <div className="h-10 w-32 bg-paper-dark rounded-lg" />
          <div className="h-10 w-24 bg-paper-dark rounded-lg" />
        </div>
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-paper-dark rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-paper-dark rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
