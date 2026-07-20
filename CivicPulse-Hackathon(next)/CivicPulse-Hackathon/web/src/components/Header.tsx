import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronDown, LogOut, ShieldAlert, Briefcase } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { NotificationPanel } from "./NotificationPanel";
import { useState } from "react";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/nearby?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="h-16 border-b border-white/10 bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-6">
      <div className="flex-1 max-w-xl">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports, areas, categories..."
            className="w-full bg-black/20 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground" />
        </form>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <NotificationPanel />

        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 hover:bg-white/5 p-1.5 rounded-full pr-3 transition-colors border border-white/5">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {user?.avatarInitial || user?.name?.charAt(0) || "?"}
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-white/10 rounded-xl shadow-2xl z-40 py-1 overflow-hidden">
                <div className="px-3 py-2 border-b border-white/5">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Link to="/profile" onClick={() => setShowUserMenu(false)}
                  className="block px-3 py-2 text-sm text-foreground hover:bg-white/5 transition-colors">Profile</Link>
                {user?.role === "admin" && (
                  <Link to="/admin" onClick={() => setShowUserMenu(false)}
                    className="px-3 py-2 text-sm text-foreground hover:bg-white/5 transition-colors flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" /> Admin Portal
                  </Link>
                )}
                {user?.role === "officer" && (
                  <Link to="/officer" onClick={() => setShowUserMenu(false)}
                    className="px-3 py-2 text-sm text-foreground hover:bg-white/5 transition-colors flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-400" /> Officer Portal
                  </Link>
                )}
                <button onClick={() => { logout(); navigate("/login"); setShowUserMenu(false); }}
                  className="w-full px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors flex items-center gap-2 border-t border-white/5">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
