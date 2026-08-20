export default function RecurringLoading() {
  return (
    <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-56 bg-paper-dark rounded" />
        <div className="h-10 w-32 bg-paper-dark rounded-lg mt-4" />
        <div className="space-y-3 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-paper-dark rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
