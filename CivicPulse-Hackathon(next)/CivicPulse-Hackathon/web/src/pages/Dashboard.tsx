import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../lib/api";
import { useIssues } from "../lib/IssuesContext";
import { useAuth } from "../lib/AuthContext";
import { TrendingUp, AlertTriangle, CheckCircle, ThumbsUp } from "lucide-react";

type DashboardData = {
  stats: { totalReports: number; resolved: number; criticalOpen: number; totalUpvotes: number; resolutionRate: number };
  categories: { name: string; count: number }[];
  recentReports: any[];
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { issues } = useIssues();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    apiGet<DashboardData>("/api/analytics/dashboard")
      .then(setData)
      .catch(() => {});
  }, [issues]);

  const stats = data?.stats || { totalReports: issues.length, resolved: 0, criticalOpen: 0, totalUpvotes: 0, resolutionRate: 0 };
  const categories = data?.categories || [];
  const recentReports = data?.recentReports || issues.slice(0, 3);

  const statCards = [
    { label: "Total Reports", value: stats.totalReports, sub: `${stats.resolutionRate}% resolution rate`, icon: TrendingUp, color: "text-primary" },
    { label: "Resolution Rate", value: `${stats.resolutionRate}%`, sub: `${stats.resolved} resolved`, icon: CheckCircle, color: "text-emerald-400" },
    { label: "Critical Open", value: stats.criticalOpen, sub: "Needs urgent attention", icon: AlertTriangle, color: "text-red-400" },
    { label: "Community Support", value: stats.totalUpvotes, sub: "Votes across all reports", icon: ThumbsUp, color: "text-blue-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome{user ? `, ${user.name}` : ""}</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening in your community.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/report")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            Report an Issue
          </button>
          <button onClick={() => navigate("/nearby")}
            className="px-4 py-2 bg-white/5 border border-white/10 text-foreground rounded-full font-medium hover:bg-white/10 transition-colors">
            Explore Nearby
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-card border border-white/5 p-6 rounded-2xl relative overflow-hidden hover:bg-white/[0.02] transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Reports</h2>
            <button onClick={() => navigate("/nearby")} className="text-xs text-primary hover:text-primary/80 transition-colors">View all →</button>
          </div>
          <div className="space-y-4">
            {recentReports.slice(0, 4).map((report: any, i: number) => (
              <div key={report.id || i} className="p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate("/nearby")}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 border ${
                      report.priority?.includes('P1') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      report.priority?.includes('P2') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      report.priority?.includes('P3') ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {report.priority}
                    </span>
                    <h4 className="font-semibold text-foreground">{report.title}</h4>
                  </div>
                  <span className="text-xs text-muted-foreground">{report.area ? `${report.area}, ` : ''}{report.city}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className={`font-medium ${
                    report.status === 'Submitted' ? 'text-blue-400' :
                    report.status === 'Under Review' ? 'text-yellow-400' :
                    report.status === 'Assigned' ? 'text-purple-400' :
                    report.status === 'In Progress' ? 'text-orange-400' :
                    'text-emerald-400'
                  }`}>{report.status}</span>
                  <span className="text-muted-foreground">By {report.authorName} • {report.upvoteCount} upvotes</span>
                </div>
              </div>
            ))}
            {recentReports.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No reports yet. Be the first to report!</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-white/5 p-6 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">By Category</h2>
            <div className="space-y-3">
              {(categories.length > 0 ? categories : [
                { name: "Loading...", count: 0 }
              ]).map((cat, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{cat.name}</span>
                  <span className="font-medium bg-white/5 px-2 py-1 rounded-md">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
