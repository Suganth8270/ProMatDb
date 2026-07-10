import { Search, Bell, User } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6">
      <span className="text-lg font-semibold tracking-tight text-gray-900">
        Pro<span className="text-emerald-600">Mat</span>DB
      </span>

      <div className="flex items-center gap-2">
        <button type="button" aria-label="Search" className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900">
          <Search className="h-5 w-5" strokeWidth={2} />
        </button>
        <button type="button" aria-label="Notifications" className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900">
          <Bell className="h-5 w-5" strokeWidth={2} />
        </button>
        <button type="button" aria-label="User menu" className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-colors hover:bg-emerald-200">
          <User className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}