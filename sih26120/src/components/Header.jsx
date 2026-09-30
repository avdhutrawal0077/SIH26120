export default function Header() {
  return (
    <header className="h-16 bg-secondary border-b border-slate-200/60 flex items-center px-6 shrink-0 z-10">
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-slate-800">Baghewala Field Optimization</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-sm font-medium text-slate-600">Well BW-042</span>
        </div>
      </div>
    </header>
  );
}
