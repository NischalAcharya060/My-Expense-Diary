export default function CalendarLoading() {
  return (
    <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-paper-dark rounded" />
            <div className="h-8 w-8 bg-paper-dark rounded" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mt-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-6 bg-paper-dark rounded" />
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="h-16 bg-paper-dark rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
