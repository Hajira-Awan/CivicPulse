import { useState, useEffect } from "react";
import { apiGet, apiPatch } from "../lib/api";
import { Shield } from "lucide-react";

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    apiGet("/api/admin/users").then((d: any) => setUsers(d.users || [])).catch(() => {});
  }, []);

  const changeRole = async (id: string, role: string) => {
    await apiPatch(`/api/admin/users/${id}/role`, { role });
    apiGet("/api/admin/users").then((d: any) => setUsers(d.users || [])).catch(() => {});
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and roles.</p>
      </div>
      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.02] border-b border-white/5 text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">City</th>
              <th className="px-6 py-4 font-medium">Reports</th>
              <th className="px-6 py-4 font-medium">Reputation</th>
              <th className="px-6 py-4 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{u.city || "—"}</td>
                <td className="px-6 py-4">{u.reportsCount}</td>
                <td className="px-6 py-4 text-primary font-medium">{u.reputation}</td>
                <td className="px-6 py-4">
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                    className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none">
                    <option value="citizen">Citizen</option>
                    <option value="officer">Officer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
