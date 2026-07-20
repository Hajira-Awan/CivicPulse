import { useState, useRef } from "react";
import { UploadCloud, Sparkles, X, Loader2, CheckCircle } from "lucide-react";
import { useIssues } from "../lib/IssuesContext";
import { useAuth } from "../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";

export function ReportIssue() {
  const { reportIssue } = useIssues();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const autoAIAnalyze = async (file: File) => {
    setAnalyzing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(file);
      });

      const data = await apiPost<{ analysis: any }>("/api/ai/analyze-image", {
        imageBase64: base64,
        mimeType: file.type,
      });

      setAiAnalysis(data.analysis);
      if (data.analysis.category) setCategory(data.analysis.category);
      if (data.analysis.severity) setSeverity(data.analysis.severity);
      if (data.analysis.description) setDescription(data.analysis.description);
      if (data.analysis.category) {
        setTitle(prev => prev ? prev : `${data.analysis.category} issue`);
      }
    } catch (err: any) {
      console.error("AI analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files).slice(0, 5 - imageFiles.length);
    const previews = newFiles.map(f => URL.createObjectURL(f));
    setImageFiles(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [...prev, ...previews]);

    // Automatically analyze the first added image and autofill the form
    if (newFiles.length > 0) {
      autoAIAnalyze(newFiles[0]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    if (index === 0) {
      setAiAnalysis(null);
    }
  };

  const handleAIAnalyze = async () => {
    if (imageFiles.length === 0) return;
    await autoAIAnalyze(imageFiles[0]);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !city || !category) return;
    setSubmitting(true);

    try {
      // Upload images first
      const urls: string[] = [];
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append("image", file);
        const data = await apiPost<{ url: string }>("/api/reports/upload-image", formData);
        urls.push(data.url);
      }

      await reportIssue({
        title, description, city, area, category, severity,
        images: urls,
      });

      setSubmitted(true);
      setTimeout(() => navigate("/nearby"), 1500);
    } catch (err: any) {
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Report Submitted!</h2>
        <p className="text-muted-foreground">Your report has been submitted successfully. You earned +10 reputation points!</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Report an Issue</h1>
        <p className="text-muted-foreground">Submit a new civic issue to be tracked and resolved by the relevant department.</p>
      </div>

      <div className="bg-card border border-white/5 rounded-2xl p-6 shadow-xl">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Photos (Up to 5)</label>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple
              onChange={(e) => handleFileSelect(e.target.files)} />
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                    <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imagePreviews.length < 5 && (
              <div onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:bg-white/5 hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <UploadCloud className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB each</p>
              </div>
            )}

            {imageFiles.length > 0 && (
              <button type="button" onClick={handleAIAnalyze} disabled={analyzing}
                className="w-full mt-2 py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                {analyzing ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
                {analyzing ? "Analyzing..." : "Analyze with AI"}
              </button>
            )}

            {aiAnalysis && (
              <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">AI Analysis Results</span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-auto">
                    {Math.round((aiAnalysis.confidence || 0.8) * 100)}% confident
                  </span>
                </div>
                <p className="text-xs text-muted-foreground"><strong>Category:</strong> {aiAnalysis.category}</p>
                <p className="text-xs text-muted-foreground"><strong>Severity:</strong> {aiAnalysis.severity}</p>
                <p className="text-xs text-muted-foreground"><strong>Department:</strong> {aiAnalysis.department}</p>
                <p className="text-xs text-muted-foreground"><strong>Description:</strong> {aiAnalysis.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Title *</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole on Main Boulevard"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Description</label>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, when you noticed it, and any risks..."
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">City *</label>
                <select required value={city} onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all appearance-none">
                  <option value="" disabled>Select a city</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Faisalabad">Faisalabad</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Area</label>
                <input type="text" value={area} onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Model Town, DHA Phase 6"
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Category *</label>
                <select required value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all appearance-none">
                  <option value="" disabled>Select category</option>
                  <option value="Pothole">Pothole</option>
                  <option value="Garbage">Garbage</option>
                  <option value="Streetlight">Streetlight</option>
                  <option value="Water Issue">Water Issue</option>
                  <option value="Encroachment">Encroachment</option>
                  <option value="Road Damage">Road Damage</option>
                  <option value="Drainage">Drainage</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all appearance-none">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 mt-4 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
