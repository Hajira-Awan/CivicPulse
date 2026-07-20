import { useState, useRef, useEffect } from "react";
import { useIssues } from "../lib/IssuesContext";
import { useAuth } from "../lib/AuthContext";
import { 
  CheckCircle, Clock, UploadCloud, Loader2, AlertTriangle, 
  Sparkles, Check, X, Shield, ArrowRight, UserPlus, FileText, ImageIcon
} from "lucide-react";
import { apiPost, apiGet } from "../lib/api";
import { getImageUrl } from "../lib/utils";

export function OfficerDashboard() {
  const { issues, updateIssueStatus, fetchIssues } = useIssues();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState("All Reports");
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Assignment states
  const [departments, setDepartments] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [isAssigningSubmit, setIsAssigningSubmit] = useState(false);

  // Resolution states
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionFile, setResolutionFile] = useState<File | null>(null);
  const [resolutionPreview, setResolutionPreview] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [aiResult, setAiResult] = useState<{ resolved: boolean; confidence: number; reason: string } | null>(null);
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch departments and officers for assignment options
    apiGet("/api/reports/departments").then(data => setDepartments(data.departments || [])).catch(() => {});
    apiGet("/api/reports/officers").then(data => setOfficers(data.officers || [])).catch(() => {});
  }, []);

  const relevantIssues = issues;

  const displayIssues = activeTab === "All Reports" 
    ? relevantIssues 
    : relevantIssues.filter(i => i.status === activeTab);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    await updateIssueStatus(id, newStatus, notes);
    setSelectedIssue(null);
    setNotes("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setResolutionFile(file);
    setResolutionPreview(URL.createObjectURL(file));
    setAiResult(null); // Reset AI check when a new file is uploaded
  };

  const handleAIVerify = async (issueId: string) => {
    if (!resolutionFile) return;
    setVerifying(true);
    setAiResult(null);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(resolutionFile);
      });

      const data = await apiPost<{ result: { resolved: boolean; confidence: number; reason: string } }>(
        "/api/ai/verify-resolution", 
        {
          imageBase64: base64,
          mimeType: resolutionFile.type,
          reportId: issueId
        }
      );

      setAiResult(data.result);
    } catch (err) {
      console.error("AI verify resolution error:", err);
      setAiResult({
        resolved: false,
        confidence: 0.5,
        reason: "Failed to connect to the AI verification service. Please try again."
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmitResolution = async (id: string) => {
    if (!resolutionFile || !aiResult?.resolved) return;
    setSubmittingResolution(true);
    try {
      const formData = new FormData();
      formData.append("image", resolutionFile);
      const data = await apiPost<{ url: string }>("/api/reports/upload-image", formData);
      
      await apiPost(`/api/reports/${id}/after-image`, { url: data.url });
      await updateIssueStatus(id, "Resolved", notes || "Issue resolved and verified by AI.");
      
      // Reset
      setResolvingId(null);
      setResolutionFile(null);
      setResolutionPreview(null);
      setAiResult(null);
      setNotes("");
      await fetchIssues();
    } catch (err) {
      console.error("Resolution submit error:", err);
    } finally {
      setSubmittingResolution(false);
    }
  };

  const handleAssign = async (issueId: string) => {
    setIsAssigningSubmit(true);
    try {
      await apiPost(`/api/reports/${issueId}/assign`, {
        departmentId: selectedDeptId || null,
        officerId: selectedOfficerId || null
      });
      setAssigningId(null);
      setSelectedDeptId("");
      setSelectedOfficerId("");
      await fetchIssues();
    } catch (err) {
      console.error("Assign error:", err);
    } finally {
      setIsAssigningSubmit(false);
    }
  };

  const getDeptName = (id?: string) => {
    return departments.find(d => d.id === id)?.name || "Not Assigned";
  };

  const getOfficerName = (id?: string) => {
    return officers.find(o => o.id === id)?.name || "Unassigned";
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Officer Dashboard</h1>
        <p className="text-muted-foreground font-medium text-sm">Manage, assign, and verify resolutions for civic issues.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-white/5 p-5 rounded-xl flex items-center gap-4 hover:bg-white/[0.02] transition-all">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg"><Clock className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold">{relevantIssues.filter(i => i.status === "Assigned").length}</div>
            <div className="text-xs text-muted-foreground font-semibold">Newly Assigned</div>
          </div>
        </div>
        <div className="bg-card border border-white/5 p-5 rounded-xl flex items-center gap-4 hover:bg-white/[0.02] transition-all">
          <div className="p-3 bg-orange-500/10 text-orange-400 rounded-lg"><Clock className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold">{relevantIssues.filter(i => i.status === "In Progress").length}</div>
            <div className="text-xs text-muted-foreground font-semibold font-medium">In Progress</div>
          </div>
        </div>
        <div className="bg-card border border-white/5 p-5 rounded-xl flex items-center gap-4 hover:bg-white/[0.02] transition-all">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg"><CheckCircle className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold">{relevantIssues.filter(i => i.status === "Resolved").length}</div>
            <div className="text-xs text-muted-foreground font-semibold font-medium">Resolved</div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5">
          {["All Reports", "Assigned", "In Progress", "Resolved"].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSelectedIssue(null); setResolvingId(null); setAssigningId(null); }}
              className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
              {tab} ({tab === "All Reports" ? relevantIssues.length : relevantIssues.filter(i => i.status === tab).length})
            </button>
          ))}
        </div>

        <div className="p-0">
          {displayIssues.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No {activeTab.toLowerCase()} issues found.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {displayIssues.map(issue => (
                <div key={issue.id} className="p-6 hover:bg-white/[0.005] transition-colors">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${
                          issue.priority.includes('P1') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          issue.priority.includes('P2') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>{issue.priority}</span>
                        <span className="text-xs text-muted-foreground font-medium">{new Date(issue.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/5">Dept: {getDeptName(issue.assignedDeptId)}</span>
                        <span className="text-xs text-muted-foreground font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/5">Officer: {getOfficerName(issue.assignedOfficerId)}</span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-foreground mb-1">{issue.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{issue.city}{issue.area ? ` — ${issue.area}` : ''} • Reported by {issue.authorName}</p>
                      
                      {issue.description && (
                        <p className="text-sm text-muted-foreground/80 bg-black/20 p-3 rounded-lg border border-white/5 mb-4">
                          {issue.description}
                        </p>
                      )}
                      
                      {issue.images && issue.images.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Report Photos:</p>
                          <div className="flex gap-2 overflow-x-auto">
                            {issue.images.map((img, i) => (
                              <div key={i} className="relative group">
                                <img src={getImageUrl(img.url)} alt="" className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                                <span className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white font-bold backdrop-blur-sm">
                                  {img.type === "before" ? "Before (Report)" : "After (Resolution)"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="w-full md:w-80 flex flex-col gap-3 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                      
                      {/* Active Status Display */}
                      <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-center">
                        <span className="text-xs text-muted-foreground block mb-1 font-semibold">Current Status</span>
                        <span className={`text-sm font-bold ${
                          issue.status === 'Assigned' ? 'text-purple-400' :
                          issue.status === 'In Progress' ? 'text-orange-400' :
                          'text-emerald-400'
                        }`}>{issue.status}</span>
                      </div>

                      {/* Action buttons */}
                      {resolvingId === issue.id ? (
                        /* RESOLUTION INTERACTIVE PANEL WITH AI CHECK */
                        <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-white/5">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-sm font-bold text-foreground">AI Resolution Check</span>
                            <button onClick={() => { setResolvingId(null); setResolutionFile(null); setResolutionPreview(null); setAiResult(null); }}
                              className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground block">Upload Resolution Picture</label>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                            
                            {resolutionPreview ? (
                              <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group">
                                <img src={resolutionPreview} alt="Resolution" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-medium text-white transition-opacity">
                                  Change Photo
                                </button>
                              </div>
                            ) : (
                              <div onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:bg-white/5 hover:border-primary/50 transition-colors cursor-pointer group">
                                <UploadCloud className="w-8 h-8 text-primary mx-auto mb-2 group-hover:scale-105 transition-transform" />
                                <span className="text-xs font-bold text-foreground block">Select Fixed Photo</span>
                                <span className="text-[10px] text-muted-foreground">PNG, JPG up to 10MB</span>
                              </div>
                            )}
                          </div>

                          {resolutionFile && (
                            <button type="button" onClick={() => handleAIVerify(issue.id)} disabled={verifying}
                              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-foreground">
                              {verifying ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
                              {verifying ? "Verifying..." : "Verify Fix with AI"}
                            </button>
                          )}

                          {/* AI verification response */}
                          {aiResult && (
                            <div className={`p-3 rounded-lg border text-xs ${
                              aiResult.resolved 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                {aiResult.resolved ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                <span className="font-bold">{aiResult.resolved ? "Verification Passed" : "Verification Failed"}</span>
                                <span className="ml-auto font-black">{Math.round(aiResult.confidence * 100)}% Match</span>
                              </div>
                              <p className="text-[11px] leading-relaxed opacity-90">{aiResult.reason}</p>
                            </div>
                          )}

                          <textarea placeholder="Add resolution notes (optional)..." value={notes} onChange={e => setNotes(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary/50 resize-none h-16" />

                          {aiResult && aiResult.resolved && (
                            <button onClick={() => handleSubmitResolution(issue.id)} 
                              disabled={submittingResolution}
                              className="w-full bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5 animate-pulse">
                              {submittingResolution ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Submit Resolution
                            </button>
                          )}
                        </div>
                      ) : assigningId === issue.id ? (
                        /* ASSIGNMENT OPTIONS PANEL */
                        <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-white/5">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-sm font-bold text-foreground">Assign Issue</span>
                            <button onClick={() => setAssigningId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground block mb-1">Department</label>
                              <select value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50">
                                <option value="">Select Department</option>
                                {departments.map(d => (
                                  <option key={d.id} value={d.id}>{d.name} ({d.city})</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-muted-foreground block mb-1">Assign Officer</label>
                              <select value={selectedOfficerId} onChange={e => setSelectedOfficerId(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50">
                                <option value="">Select Officer</option>
                                {officers.map(o => (
                                  <option key={o.id} value={o.id}>{o.name} ({o.city})</option>
                                ))}
                              </select>
                            </div>

                            <button onClick={() => handleAssign(issue.id)} disabled={isAssigningSubmit}
                              className="w-full bg-primary text-primary-foreground text-xs font-bold py-2 rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                              {isAssigningSubmit ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                              Update Assignment
                            </button>
                          </div>
                        </div>
                      ) : selectedIssue === issue.id ? (
                        /* UPDATE NOTES / START WORK PANEL */
                        <div className="space-y-3">
                          <textarea placeholder="Add status notes..." value={notes} onChange={e => setNotes(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary/50 resize-none h-20" />
                          <div className="flex gap-2">
                            {activeTab === "Assigned" && (
                              <button onClick={() => handleUpdateStatus(issue.id, "In Progress")} 
                                className="flex-1 bg-orange-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-orange-600 transition-colors">
                                Start Work
                              </button>
                            )}
                          </div>
                          <button onClick={() => setSelectedIssue(null)} className="w-full text-xs text-muted-foreground hover:text-foreground font-semibold">Cancel</button>
                        </div>
                      ) : (
                        /* CORE ACTIONS SELECTOR */
                        <>
                          {issue.status !== "Resolved" && (
                            <>
                              {issue.status === "Assigned" && (
                                <button onClick={() => setSelectedIssue(issue.id)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-foreground text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                                  <Clock className="w-4 h-4" /> Start Work (In Progress)
                                </button>
                              )}
                              
                              <button onClick={() => { setResolvingId(issue.id); setSelectedIssue(null); setAssigningId(null); }} 
                                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                                <CheckCircle className="w-4 h-4" /> Resolve with AI Check
                              </button>

                              <button onClick={() => { setAssigningId(issue.id); setSelectedIssue(null); setResolvingId(null); setSelectedDeptId(issue.assignedDeptId || ""); setSelectedOfficerId(issue.assignedOfficerId || ""); }}
                                className="w-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                                <UserPlus className="w-4 h-4" /> Reassign Issue
                              </button>
                            </>
                          )}
                          {issue.status === "Resolved" && (
                            <div className="text-center text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1">
                              <Check className="w-4 h-4 text-emerald-400" /> Resolution Completed
                            </div>
                          )}
                        </>
                      )}

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
