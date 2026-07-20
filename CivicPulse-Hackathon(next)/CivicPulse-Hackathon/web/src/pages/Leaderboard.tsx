import { useState, useEffect } from "react";
import { Medal, Award } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { apiGet } from "../lib/api";

export function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    apiGet("/api/analytics/leaderboard")
      .then((data: any) => {
        setLeaderboard(data.leaderboard || []);
        setBadges(data.badges || []);
      })
      .catch(() => {});
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const myRank = leaderboard.findIndex(u => u.id === user?.id) + 1;
  const myEntry = leaderboard.find(u => u.id === user?.id);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">Top contributors making a difference in their communities.</p>
      </div>

      {/* Top 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {top3.map((u) => (
          <div key={u.rank} className={`bg-card border p-6 rounded-2xl relative overflow-hidden ${u.rank === 1 ? 'border-primary/50 shadow-[0_0_30px_rgba(245,166,35,0.15)]' : 'border-white/5'}`}>
            {u.rank === 1 && <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>}
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                u.rank === 1 ? 'bg-primary text-primary-foreground' :
                u.rank === 2 ? 'bg-zinc-300 text-zinc-900' :
                'bg-amber-700 text-amber-100'
              }`}>#{u.rank}</div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{u.name}</h3>
                <p className="text-sm text-muted-foreground">{u.city || "Pakistan"}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-2xl font-black text-primary">{u.reputation} <span className="text-sm font-medium text-muted-foreground">pts</span></span>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span>{u.reportsCount} reports</span>
              <span>{u.resolvedCount} resolved</span>
            </div>
          </div>
        ))}
        {top3.length === 0 && (
          <div className="col-span-3 text-center py-8 text-muted-foreground">Loading leaderboard...</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {/* My Position */}
          {myEntry && (
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">#{myRank}</div>
                <div>
                  <h4 className="font-bold text-foreground">You</h4>
                  <p className="text-xs text-muted-foreground">{myEntry.reputation} pts · {myEntry.reportsCount} reports · {myEntry.resolvedCount} resolved</p>
                </div>
              </div>
            </div>
          )}

          {/* Remaining Ranks */}
          <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
            {rest.map((u) => (
              <div key={u.rank} className={`p-4 border-b border-white/5 flex items-center justify-between hover:bg-white/[0.02] ${u.id === user?.id ? 'bg-white/[0.02]' : ''}`}>
                <div className="flex items-center gap-4">
                  <span className={`w-6 text-center font-bold ${u.id === user?.id ? 'text-primary' : 'text-muted-foreground'}`}>{u.rank}</span>
                  <div>
                    <h4 className={`font-medium ${u.id === user?.id ? 'text-primary' : 'text-foreground'}`}>{u.id === user?.id ? "You" : u.name}</h4>
                    <p className="text-xs text-muted-foreground">{u.city || "Pakistan"}</p>
                  </div>
                </div>
                <span className={`font-bold ${u.id === user?.id ? 'text-primary' : 'text-foreground'}`}>{u.reputation} pts</span>
              </div>
            ))}
            {rest.length === 0 && top3.length > 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">No more entries</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Badges
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {badges.map((badge: any, i: number) => (
              <div key={i} className="p-4 rounded-xl border bg-card border-white/5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 text-primary">
                    <Medal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{badge.name}</h4>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    <p className="text-xs text-primary/60 mt-1">{badge.requirement}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
