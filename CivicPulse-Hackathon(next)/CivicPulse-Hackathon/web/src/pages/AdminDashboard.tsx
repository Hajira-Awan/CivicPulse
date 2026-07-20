import { useState, useEffect } from "react";
import { useIssues } from "../lib/IssuesContext";
import { useAuth } from "../lib/AuthContext";
import { apiGet, apiPost } from "../lib/api";
import { CheckCircle, Clock, AlertTriangle, AlertCircle, TrendingUp, Users, Building2, UserPlus, ShieldAlert } from "lucide-react";

export function AdminDashboard() {
  const { issues, updateIssueStatus, fetchIssues } = useIssues();
  const [adminStats, setAdminStats] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);

  useEffect(() => {
    apiGet("/api/admin/stats").then(setAdminStats).catch(() => {});
    apiGet("/api/reports/departments").then(data => setDepartments(data.departments || [])).catch(() => {});
    apiGet("/api/reports/officers").then(data => setOfficers(data.officers || [])).catch(() => {});
  }, [issues]);

  const handleAssign = async (issueId: string, deptId: string | null, officerId: string | null) => {
    try {
      await apiPost(`/api/reports/${issueId}/assign`, {
        departmentId: deptId || null,
        officerId: officerId || null
      });
      await fetchIssues();
    } catch (err) {
      console.error("Failed to assign issue:", err);
    }
  };

  const filteredIssues = filter
    ? issues.filter(i => i.status === filter)
    : issues;

  const s = adminStats || {};

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground font-medium text-sm">Platform-wide overview, department routing, and issue assignments.</p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-white/5 p-5 rounded-xl flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
          <div className="p-3 bg-primary/10 text-primary rounded-lg"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold">{s.totalReports || issues.length}</div>
            <div className="text-xs text-muted-foreground font-semibold">Total Reports</div>
          </div>
        </div>
        <div className="bg-card border border-white/5 p-5 rounded-xl flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Users className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold">{s.totalUsers || 0}</div>
            <div className="text-xs text-muted-foreground font-semibold">Citizens: {s.citizenCount || 0} · Officers: {s.officerCount || 0}</div>
          </div>
        </div>
        <div className="bg-card border border-white/5 p-5 rounded-xl flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg"><Building2 className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold">{s.totalDepartments || 0}</div>
            <div className="text-xs text-muted-foreground font-semibold">Departments</div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: "Submitted", icon: AlertCircle, color: "blue", label: "New" },
          { key: "Under Review", icon: Clock, color: "yellow", label: "Review" },
          { key: "Assigned", icon: AlertTriangle, color: "purple", label: "Assigned" },
          { key: "Resolved", icon: CheckCircle, color: "emerald", label: "Resolved" },
        ].map(({ key, icon: Icon, color, label }) => (
          <button key={key} onClick={() => setFilter(filter === key ? "" : key)}
            className={`bg-card border p-4 rounded-xl flex items-center gap-4 transition-colors ${
              filter === key 
                ? 'border-primary/50 bg-primary/5' 
                : 'border-white/5 hover:bg-white/[0.02]'
            }`}>
            <div className={`p-3 bg-${color}-500/10 text-${color}-400 rounded-lg`}><Icon className="w-6 h-6" /></div>
            <div>
              <div className="text-2xl font-bold">{s.statusBreakdown?.[key] || issues.filter(i => i.status === key).length}</div>
              <div className="text-xs text-muted-foreground font-semibold">{label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Category & City Charts */}
      {adminStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-white/5 p-6 rounded-2xl">
            <h3 className="font-semibold mb-4 text-foreground">By Category</h3>
            <div className="space-y-3">
              {Object.entries(s.categoryBreakdown || {}).sort(([,a]: any, [,b]: any) => b - a).map(([cat, count]: any) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-28 truncate font-medium">{cat}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(count / s.totalReports) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-8 text-right text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-white/5 p-6 rounded-2xl">
            <h3 className="font-semibold mb-4 text-foreground">By City</h3>
            <div className="space-y-3">
              {Object.entries(s.cityBreakdown || {}).sort(([,a]: any, [,b]: any) => b - a).map(([city, count]: any) => (
                <div key={city} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-28 truncate font-medium">{city}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-blue-400/60 rounded-full" style={{ width: `${(count / s.totalReports) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-8 text-right text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Issue Management Table */}
      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Issue Assignment & Routing {filter && `— ${filter}`}</h3>
          {filter && <button onClick={() => setFilter("")} className="text-xs text-primary font-bold">Clear filter</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.02] border-b border-white/5 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Issue</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Department Route</th>
                <th className="px-6 py-4 font-semibold">Assigned Officer</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredIssues.map(issue => (
                <tr key={issue.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground text-sm">{issue.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 font-semibold">{issue.category} • By {issue.authorName}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-semibold">{issue.city}{issue.area ? ` — ${issue.area}` : ''}</td>
                  
                  {/* Department Assignment Dropdown */}
                  <td className="px-6 py-4">
                    <select value={issue.assignedDeptId || ""} onChange={(e) => handleAssign(issue.id, e.target.value || null, issue.assignedOfficerId || null)}
                      className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50 max-w-[200px]">
                      <option value="">Not Assigned</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.city})</option>
                      ))}
                    </select>
                  </td>

                  {/* Officer Assignment Dropdown */}
                  <td className="px-6 py-4">
                    <select value={issue.assignedOfficerId || ""} onChange={(e) => handleAssign(issue.id, issue.assignedDeptId || null, e.target.value || null)}
                      className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50 max-w-[160px]">
                      <option value="">Unassigned</option>
                      {officers.map(o => (
                        <option key={o.id} value={o.id}>{o.name} ({o.city})</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`font-semibold text-xs ${
                      issue.status === 'Submitted' ? 'text-blue-400' :
                      issue.status === 'Under Review' ? 'text-yellow-400' :
                      issue.status === 'Assigned' ? 'text-purple-400' :
                      issue.status === 'In Progress' ? 'text-orange-400' :
                      'text-emerald-400'
                    }`}>{issue.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select value={issue.status} onChange={(e) => updateIssueStatus(issue.id, e.target.value)}
                      className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50 font-semibold">
                      <option value="Submitted">Submitted</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredIssues.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No issues found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
