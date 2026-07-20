import { useState, useEffect } from "react";
import { ImageIcon, CheckCircle } from "lucide-react";
import { apiGet } from "../lib/api";
import { getImageUrl } from "../lib/utils";

export function Gallery() {
  const [resolvedReports, setResolvedReports] = useState<any[]>([]);

  useEffect(() => {
    apiGet("/api/analytics/gallery")
      .then((data: any) => setResolvedReports(data.reports || []))
      .catch(() => {});
  }, []);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Before / After</h1>
        <p className="text-muted-foreground">See the real impact of community reporting. These issues were resolved thanks to citizen reports.</p>
      </div>

      {resolvedReports.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-emerald-400/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No resolved issues with images yet. Keep reporting!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resolvedReports.map((issue: any, i: number) => (
            <div key={issue.id || i} className="bg-card border border-white/5 rounded-2xl overflow-hidden group cursor-pointer hover:border-white/20 transition-colors">
              <div className="aspect-[4/3] bg-black/40 relative overflow-hidden flex items-center justify-center">
                {issue.images && issue.images.length > 0 ? (
                  <img src={getImageUrl(issue.images[0].url)} alt={issue.title} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-white/10" />
                )}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white border border-white/10">
                  Before
                </div>
                <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-medium">
                  ✓ Resolved
                </div>
              </div>
              <div className="p-5">
                <span className="text-xs font-medium text-primary mb-2 block">{issue.category}</span>
                <h3 className="font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">{issue.title}</h3>
                <p className="text-sm text-muted-foreground">{issue.area ? `${issue.area}, ` : ''}{issue.city} • {timeAgo(issue.resolvedAt || issue.updatedAt)}</p>
                {issue.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{issue.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
