import { useState, useEffect } from "react";
import { apiGet, apiPost } from "../lib/api";
import { Building2, Plus } from "lucide-react";

export function AdminDepartments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [desc, setDesc] = useState("");

  const fetchDepts = () => {
    apiGet("/api/admin/departments").then((d: any) => setDepartments(d.departments || [])).catch(() => {});
  };

  useEffect(() => { fetchDepts(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city || !category) return;
    await apiPost("/api/admin/departments", { name, city, category, description: desc });
    setShowAdd(false); setName(""); setCity(""); setCategory(""); setDesc("");
    fetchDepts();
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Departments</h1>
          <p className="text-muted-foreground">Manage municipal departments and assignments.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-card border border-white/5 p-6 rounded-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Department name"
              className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50" required />
            <select value={city} onChange={(e) => setCity(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground appearance-none" required>
              <option value="">City</option>
              <option value="Lahore">Lahore</option><option value="Karachi">Karachi</option>
              <option value="Islamabad">Islamabad</option><option value="Rawalpindi">Rawalpindi</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground appearance-none" required>
              <option value="">Category handled</option>
              <option value="Pothole">Pothole</option><option value="Garbage">Garbage</option>
              <option value="Streetlight">Streetlight</option><option value="Water Issue">Water Issue</option>
              <option value="Road Damage">Road Damage</option><option value="Encroachment">Encroachment</option>
            </select>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)"
              className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50" />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Create</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((d: any) => (
          <div key={d.id} className="bg-card border border-white/5 p-5 rounded-2xl hover:bg-white/[0.02] transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg"><Building2 className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-foreground">{d.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{d.city} • Handles: {d.category}</p>
                {d.description && <p className="text-xs text-muted-foreground mt-1">{d.description}</p>}
                <p className="text-xs text-primary mt-2">{d.officers || 0} officers assigned</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
