import { useState, useEffect } from "react";
import { Medal, MapPin, Mail, Calendar, Edit3, Check, Loader2 } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { apiGet, apiPatch } from "../lib/api";

export function Profile() {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      apiGet(`/api/analytics/profile/${user.id}`).then(setProfileData).catch(() => {});
    }
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPatch("/api/auth/profile", { name: editName, city: editCity });
      await refreshUser();
      setEditing(false);
    } catch {}
    setSaving(false);
  };

  const u = profileData?.user || user;
  const badges = profileData?.badges || [];
  const rank = profileData?.rank || 0;
  const reports = profileData?.reports || [];

  const stats = [
    { label: "Reports Filed", value: u?.reportsCount || 0 },
    { label: "Supported", value: u?.supportedCount || 0 },
    { label: "Resolved", value: u?.resolvedCount || 0 },
    { label: "Badges Earned", value: badges.filter((b: any) => b.earned).length },
  ];

  const createdDate = u?.createdAt ? new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Unknown";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-card border border-white/5 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
          <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center border-4 border-background shadow-xl">
            <span className="text-5xl font-black text-primary">{u?.avatarInitial || u?.name?.charAt(0) || "?"}</span>
          </div>
          <div className="flex-1 space-y-4">
            {editing ? (
              <div className="space-y-3">
                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-bold bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:border-primary/50 w-full max-w-xs" />
                <select value={editCity} onChange={(e) => setEditCity(e.target.value)}
                  className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none">
                  <option value="">Select city</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Faisalabad">Faisalabad</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-1">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                  </button>
                  <button onClick={() => setEditing(false)} className="px-3 py-1.5 border border-white/10 rounded-lg text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold text-foreground">{u?.name || "User"}</h1>
                  <button onClick={() => { setEditing(true); setEditName(u?.name || ""); setEditCity(u?.city || ""); }}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    <Edit3 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-primary font-medium flex items-center gap-2">
                  <span className="bg-primary/20 px-2 py-0.5 rounded text-sm">{u?.role || "citizen"}</span>
                  {u?.reputation || 0} reputation
                  {rank > 0 && <span className="text-muted-foreground">• Rank #{rank}</span>}
                </p>
              </>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {u?.city && <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {u.city}</div>}
              <div className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {u?.email || "N/A"}</div>
              <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {createdDate}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border border-white/5 p-6 rounded-2xl text-center hover:bg-white/[0.02] transition-colors">
            <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Medal className="w-6 h-6 text-primary" /> Your Badges
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {badges.map((badge: any, i: number) => (
            <div key={i} className={`p-5 rounded-2xl border flex items-start gap-4 transition-colors ${badge.earned ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' : 'bg-card border-white/5 opacity-50 grayscale'}`}>
              <div className={`p-3 rounded-xl ${badge.earned ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'}`}>
                <Medal className="w-6 h-6" />
              </div>
              <div>
                <h4 className={`font-bold text-lg ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>{badge.name}</h4>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
                {badge.earned && badge.earnedAt && (
                  <p className="text-xs text-primary mt-1">Earned {new Date(badge.earnedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))}
          {badges.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2">Start reporting issues to earn badges!</p>
          )}
        </div>
      </div>

      {reports.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Your Reports</h2>
          <div className="space-y-3">
            {reports.slice(0, 5).map((r: any) => (
              <div key={r.id} className="bg-card border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">{r.title}</h4>
                  <p className="text-xs text-muted-foreground">{r.city} • {r.category}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  r.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400' :
                  r.status === 'In Progress' ? 'bg-orange-500/10 text-orange-400' :
                  'bg-blue-500/10 text-blue-400'
                }`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
