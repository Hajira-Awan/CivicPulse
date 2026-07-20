import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { LayoutDashboard, LogOut, Briefcase } from "lucide-react";

export function OfficerLayout() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Officer Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-card/50 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/5">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground mb-4 inline-block">← Back to App</Link>
          <Link to="/officer" className="flex items-center gap-2 text-primary font-bold text-xl">
            <Briefcase className="w-6 h-6" />
            Officer Portal
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link to="/officer" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${location.pathname === '/officer' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Officer Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/5 bg-card/50 flex items-center justify-between px-6 sticky top-0 z-10 backdrop-blur-md">
          <h2 className="font-semibold text-lg">Department Workspace</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">Officer Active</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
