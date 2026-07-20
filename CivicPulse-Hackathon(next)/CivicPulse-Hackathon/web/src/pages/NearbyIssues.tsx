import { useState, useEffect, useCallback } from "react";
import { Search, Filter, SlidersHorizontal, ThumbsUp, ChevronDown } from "lucide-react";
import { useIssues, type Issue } from "../lib/IssuesContext";
import { getImageUrl } from "../lib/utils";

export function NearbyIssues() {
  const { issues, total, loading, fetchIssues, upvoteIssue } = useIssues();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [upvotingId, setUpvotingId] = useState<string | null>(null);

  const doSearch = useCallback(() => {
    fetchIssues({ search, city: cityFilter, category: categoryFilter, status: statusFilter, sort: sortBy });
  }, [search, cityFilter, categoryFilter, statusFilter, sortBy, fetchIssues]);

  useEffect(() => {
    const timer = setTimeout(doSearch, 300);
    return () => clearTimeout(timer);
  }, [search, cityFilter, categoryFilter, statusFilter, sortBy]);

  const handleUpvote = async (id: string) => {
    setUpvotingId(id);
    try { await upvoteIssue(id); } catch {}
    setUpvotingId(null);
  };

  const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad"];
  const categories = ["Pothole", "Garbage", "Streetlight", "Water Issue", "Road Damage", "Encroachment", "Drainage"];
  const statuses = ["Submitted", "Under Review", "Assigned", "In Progress", "Resolved"];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-foreground">Nearby Issues</h1>
        <div className="flex flex-wrap items-center gap-3 bg-card border border-white/5 p-4 rounded-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, area, or description..."
              className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
          </div>

          {/* City Filter */}
          <div className="relative">
            <button onClick={() => { setShowCityDropdown(!showCityDropdown); setShowCatDropdown(false); setShowStatusDropdown(false); }}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${cityFilter ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-black/20 border-white/10 hover:bg-white/5'}`}>
              <Filter className="w-4 h-4" /> {cityFilter || "Cities"} <ChevronDown className="w-3 h-3" />
            </button>
            {showCityDropdown && (
              <div className="absolute top-full mt-1 left-0 bg-card border border-white/10 rounded-lg shadow-xl z-20 min-w-[140px] py-1">
                <button onClick={() => { setCityFilter(""); setShowCityDropdown(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/5">All Cities</button>
                {cities.map(c => (
                  <button key={c} onClick={() => { setCityFilter(c); setShowCityDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/5 ${cityFilter === c ? 'text-primary' : 'text-foreground'}`}>{c}</button>
                ))}
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative">
            <button onClick={() => { setShowCatDropdown(!showCatDropdown); setShowCityDropdown(false); setShowStatusDropdown(false); }}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${categoryFilter ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-black/20 border-white/10 hover:bg-white/5'}`}>
              <Filter className="w-4 h-4" /> {categoryFilter || "Categories"} <ChevronDown className="w-3 h-3" />
            </button>
            {showCatDropdown && (
              <div className="absolute top-full mt-1 left-0 bg-card border border-white/10 rounded-lg shadow-xl z-20 min-w-[140px] py-1">
                <button onClick={() => { setCategoryFilter(""); setShowCatDropdown(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/5">All</button>
                {categories.map(c => (
                  <button key={c} onClick={() => { setCategoryFilter(c); setShowCatDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/5 ${categoryFilter === c ? 'text-primary' : 'text-foreground'}`}>{c}</button>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowCityDropdown(false); setShowCatDropdown(false); }}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${statusFilter ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-black/20 border-white/10 hover:bg-white/5'}`}>
              <SlidersHorizontal className="w-4 h-4" /> {statusFilter || "Status"} <ChevronDown className="w-3 h-3" />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full mt-1 left-0 bg-card border border-white/10 rounded-lg shadow-xl z-20 min-w-[140px] py-1">
                <button onClick={() => { setStatusFilter(""); setShowStatusDropdown(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/5">All</button>
                {statuses.map(s => (
                  <button key={s} onClick={() => { setStatusFilter(s); setShowStatusDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/5 ${statusFilter === s ? 'text-primary' : 'text-foreground'}`}>{s}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <p>{loading ? "Loading..." : `${total} reports found`}</p>
        <div className="flex items-center gap-2">
          <span>Sort:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="upvotes">Most upvoted</option>
            <option value="priority">Highest priority</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {issues.map((issue) => (
          <div key={issue.id} className="bg-card border border-white/5 p-5 rounded-2xl hover:bg-white/[0.02] transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 border ${
                  issue.priority.includes('P1') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  issue.priority.includes('P2') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                  issue.priority.includes('P3') ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>{issue.priority}</span>
                <h3 className="font-semibold text-lg text-foreground leading-tight">{issue.title}</h3>
              </div>
            </div>
            <div className="space-y-1 mb-4">
              <p className="text-sm text-muted-foreground">{issue.city}{issue.area ? ` • ${issue.area}` : ''} • {issue.category}</p>
              {issue.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{issue.description}</p>}
            </div>
            {issue.images && issue.images.length > 0 && (
              <div className="mb-3 flex gap-2 overflow-x-auto">
                {issue.images.slice(0, 3).map((img, i) => (
                  <img key={i} src={getImageUrl(img.url)} alt="" className="w-20 h-20 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-3 text-xs">
                <span className={`font-medium ${
                  issue.status === 'Submitted' ? 'text-blue-400' :
                  issue.status === 'Under Review' ? 'text-yellow-400' :
                  issue.status === 'Assigned' ? 'text-purple-400' :
                  issue.status === 'In Progress' ? 'text-orange-400' :
                  'text-emerald-400'
                }`}>{issue.status}</span>
                <span className="text-muted-foreground">By {issue.authorName}</span>
              </div>
              <button onClick={() => handleUpvote(issue.id)} disabled={upvotingId === issue.id}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-white/10 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-colors disabled:opacity-50">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="font-medium">{issue.upvoteCount}</span>
              </button>
            </div>
          </div>
        ))}
        {!loading && issues.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground">No issues found. Try different filters or be the first to report!</div>
        )}
      </div>
    </div>
  );
}
