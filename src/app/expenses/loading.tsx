export default function ExpensesLoading() {
  return (
    <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-paper-dark rounded" />
        <div className="flex gap-3 mt-4">
          <div className="h-10 flex-1 bg-paper-dark rounded-lg" />
          <div className="h-10 w-24 bg-paper-dark rounded-lg" />
        </div>
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-7 w-20 bg-paper-dark rounded-full" />
          ))}
        </div>
        <div className="space-y-3 mt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-paper-dark rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
