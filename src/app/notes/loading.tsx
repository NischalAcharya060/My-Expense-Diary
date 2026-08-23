export default function NotesLoading() {
  return (
    <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 bg-paper-dark rounded" />
        <div className="h-10 w-32 bg-paper-dark rounded-lg mt-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 bg-paper-dark rounded-lg" style={{ transform: `rotate(${i % 2 === 0 ? "1deg" : "-1deg"})` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
