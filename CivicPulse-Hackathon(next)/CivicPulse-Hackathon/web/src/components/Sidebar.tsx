import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/AuthContext";
import {
  LayoutDashboard, AlertTriangle, MapPin, Trophy,
  Image as ImageIcon, MessageSquare, User, LogOut, ShieldAlert, Briefcase,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Report an Issue", path: "/report", icon: AlertTriangle },
  { name: "Nearby Issues", path: "/nearby", icon: MapPin },
  { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
  { name: "Before / After", path: "/gallery", icon: ImageIcon },
  { name: "AI Assistant", path: "/assistant", icon: MessageSquare },
  { name: "Profile", path: "/profile", icon: User },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 border-r border-white/10 bg-card hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
          CivicPulse
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Civic Intelligence</p>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}>
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </Link>
          );
        })}

        {user?.role === "admin" && (
          <Link to="/admin"
            className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mt-4 border-t border-white/5 pt-4",
              location.pathname.startsWith("/admin") ? "bg-red-500/10 text-red-400" : "text-red-400/60 hover:bg-red-400/10 hover:text-red-400"
            )}>
            <ShieldAlert className="w-5 h-5" /> Admin Portal
          </Link>
        )}
        {user?.role === "officer" && (
          <Link to="/officer"
            className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mt-4 border-t border-white/5 pt-4",
              location.pathname.startsWith("/officer") ? "bg-purple-500/10 text-purple-400" : "text-purple-400/60 hover:bg-purple-400/10 hover:text-purple-400"
            )}>
            <Briefcase className="w-5 h-5" /> Officer Portal
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.avatarInitial || user?.name?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || "Guest"}</p>
              <p className="text-xs text-muted-foreground">{user?.reputation || 0} reputation</p>
            </div>
          </div>
        </div>
        <button onClick={() => { logout(); navigate("/login"); }}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
