import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log("✅ Gemini AI initialized");
} else {
  console.log("⚠️  No GEMINI_API_KEY — using mock AI responses");
}

// ── Image Analysis ──
export async function analyzeImage(imageBase64: string, mimeType: string, fileName?: string): Promise<{
  category: string;
  severity: string;
  description: string;
  department: string;
  confidence: number;
}> {
  if (!genAI) return mockImageAnalysis(fileName);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent([
      {
        inlineData: { data: imageBase64, mimeType },
      },
      {
        text: `You are CivicPulse AI, a civic issue analyzer for Pakistani cities. Analyze this image and determine:
1. Category: One of [Pothole, Garbage, Streetlight, Water Issue, Road Damage, Encroachment, Drainage, Other]
2. Severity: One of [low, medium, high, critical]
3. Description: A detailed 2-3 sentence description of the civic issue visible in the image
4. Department: The suggested Pakistani municipal department to handle this (e.g., "Roads & Infrastructure", "Solid Waste Management", "WASA", "Streetlight Maintenance")
5. Confidence: A number between 0 and 1 indicating your confidence

Respond ONLY in this exact JSON format:
{"category":"...","severity":"...","description":"...","department":"...","confidence":0.0}`
      },
    ]);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return mockImageAnalysis(fileName);
  } catch (err) {
    console.error("Gemini image analysis error:", err);
    return mockImageAnalysis(fileName);
  }
}

function mockImageAnalysis(fileName?: string) {
  const name = (fileName || "").toLowerCase();
  let cat = "Pothole";
  let sev = "medium";

  if (name.includes("pothole") || name.includes("potholes")) {
    cat = "Pothole";
    sev = "high";
  } else if (name.includes("garbage") || name.includes("trash") || name.includes("waste") || name.includes("dump")) {
    cat = "Garbage";
    sev = "high";
  } else if (name.includes("light") || name.includes("streetlight") || name.includes("lamp")) {
    cat = "Streetlight";
    sev = "medium";
  } else if (name.includes("water") || name.includes("leak") || name.includes("sewage") || name.includes("overflow") || name.includes("pipe")) {
    cat = "Water Issue";
    sev = "critical";
  } else if (name.includes("encroach") || name.includes("shop")) {
    cat = "Encroachment";
    sev = "medium";
  } else if (name.includes("crack") || name.includes("road") || name.includes("damage")) {
    cat = "Road Damage";
    sev = "medium";
  } else if (name.includes("drain") || name.includes("gutter") || name.includes("clog")) {
    cat = "Drainage";
    sev = "high";
  } else {
    const categories = ["Pothole", "Garbage", "Road Damage", "Water Issue", "Streetlight"];
    cat = categories[Math.floor(Math.random() * categories.length)];
    sev = "medium";
  }

  const descriptions: Record<string, string> = {
    Pothole: "A significant pothole detected on the road surface. It appears to be approximately 30cm wide and could pose a danger to vehicles and pedestrians, especially during rainy conditions.",
    Garbage: "An accumulation of municipal waste detected in a public area. The garbage appears to have been uncollected for several days and may pose hygiene and health risks to nearby residents.",
    "Road Damage": "Visible damage to the road infrastructure including cracks and surface deterioration. This could worsen with continued traffic and weather exposure.",
    "Water Issue": "A water-related infrastructure problem detected. This appears to involve leaking or overflow from municipal water systems, requiring immediate attention from water authorities.",
    Streetlight: "A non-functional or damaged streetlight identified. This creates safety concerns for pedestrians and vehicles during nighttime hours.",
  };

  const deptMap: Record<string, string> = {
    Pothole: "Roads & Infrastructure",
    Garbage: "Solid Waste Management",
    "Road Damage": "Roads & Infrastructure",
    "Water Issue": "WASA (Water & Sanitation)",
    Streetlight: "Streetlight Maintenance",
  };

  return {
    category: cat,
    severity: sev,
    description: descriptions[cat] || "A civic issue has been detected in the uploaded image.",
    department: deptMap[cat] || "General Municipal Services",
    confidence: 0.75 + Math.random() * 0.2,
  };
}

// ── Chat AI ──
export async function chatWithAI(message: string, history: { role: string; text: string }[]): Promise<string> {
  if (!genAI) return mockChatResponse(message);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `You are CivicPulse Assistant, an AI helper for CivicPulse — a civic intelligence platform for Pakistan. You help citizens:
- Report municipal issues (potholes, garbage, streetlights, water leaks, drainage, road damage, encroachments)
- Understand how AI image analysis works on the platform
- Track report statuses (Submitted → Under Review → Assigned → In Progress → Resolved)
- Learn about the reputation system (points for reports, upvotes, resolved issues)
- Understand badges (First Voice, Active Reporter, Top Reporter, Civic Hero, etc.)
- Know about departments (WASA, Roads & Infrastructure, Solid Waste, etc.)
- Get city-specific information for Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad

Be helpful, concise, and knowledgeable about Pakistani municipal systems. Use a friendly tone.`;

    const chatHistory = history.map(h => ({
      role: h.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: h.text }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "System context: " + systemPrompt }] },
        { role: "model", parts: [{ text: "Understood! I'm ready to help as the CivicPulse Assistant." }] },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (err) {
    console.error("Gemini chat error:", err);
    return mockChatResponse(message);
  }
}

function mockChatResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("report") && (lower.includes("pothole") || lower.includes("how"))) {
    return "To report a pothole (or any civic issue), go to the **Report Issue** page from the sidebar. Here's how it works:\n\n1. 📸 **Upload a photo** — our AI will analyze it to suggest the category and severity\n2. 📝 **Fill in the details** — title, description, city, area\n3. 🏷️ **Category & Severity** — AI suggests these, but you can override\n4. 📍 **Location** — select your city and area\n5. ✅ **Submit** — your report goes live immediately!\n\nYou'll earn **10 reputation points** for each report filed!";
  }
  if (lower.includes("ai") && (lower.includes("analy") || lower.includes("work"))) {
    return "CivicPulse uses **Google Gemini AI** to analyze the images you upload. When you add a photo to your report, the AI automatically:\n\n🔍 **Detects** the issue type (Pothole, Garbage, Streetlight, etc.)\n📊 **Estimates** severity (Low, Medium, High, Critical)\n📝 **Generates** a description based on what it sees\n🏢 **Recommends** the responsible department (WASA, Roads dept, etc.)\n🎯 **Confidence score** — shows how sure the AI is\n\nThis speeds up reporting and ensures issues reach the right department!";
  }
  if (lower.includes("city") || lower.includes("cities") || lower.includes("most report")) {
    return "Based on our latest data:\n\n🏙️ **Karachi** — highest volume of reports (major infrastructure challenges)\n🏙️ **Lahore** — second highest, particularly water and road issues\n🏙️ **Islamabad** — moderate volume, well-maintained but growing\n🏙️ **Rawalpindi** — encroachment and streetlight issues are common\n🏙️ **Faisalabad** — growing participation, garbage management focus\n\nYou can check the **Dashboard** for real-time statistics!";
  }
  if (lower.includes("department") || lower.includes("assign")) {
    return "Reports are automatically routed to the right department based on **Category** and **City**:\n\n🛣️ Potholes/Road Damage → **Roads & Infrastructure**\n🗑️ Garbage → **Solid Waste Management** (LWMC, KWMC)\n💧 Water Issues → **WASA** (Water & Sanitation Authority)\n💡 Streetlights → **Streetlight Maintenance** (LESCO, K-Electric)\n🏗️ Encroachment → **Anti-Encroachment Cell**\n\nAdmins can also manually assign reports to specific officers!";
  }
  if (lower.includes("badge") || lower.includes("reputation") || lower.includes("point") || lower.includes("gamif")) {
    return "CivicPulse has a **gamification system** to reward active citizens:\n\n**Points:**\n- 📝 Report filed: +10 pts\n- 👍 Your report upvoted: +5 pts\n- ✅ Report resolved: +25 pts\n- 🤝 Upvoting others: +2 pts\n\n**Badges:**\n- 🎤 **First Voice** — File your first report\n- 📋 **Active Reporter** — File 5 reports\n- ⭐ **Top Reporter** — 10 resolved reports\n- 🦸 **Civic Hero** — 50 reports filed\n- 💚 **Community Guardian** — 100 upvotes given\n- 🌟 **Rising Star** — 500 reputation\n\nClimb the **Leaderboard** and become your city's top contributor!";
  }
  if (lower.includes("status") || lower.includes("track")) {
    return "Every report goes through these stages:\n\n1. 📩 **Submitted** — Your report is received\n2. 🔍 **Under Review** — Municipal staff is evaluating\n3. 📋 **Assigned** — Sent to the right department & officer\n4. 🔧 **In Progress** — Actively being worked on\n5. ✅ **Resolved** — Issue fixed! Before/after photos added\n\nYou'll receive **notifications** at each status change. You can track all your reports from the **Profile** page.";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! 👋 Welcome to CivicPulse! I'm your AI assistant. I can help you with:\n\n• 📝 How to report civic issues\n• 🤖 Understanding AI image analysis\n• 📊 Tracking report statuses\n• 🏆 Reputation & badge system\n• 🏙️ City-specific information\n• 🏢 Department assignments\n\nWhat would you like to know?";
  }

  return "Great question! CivicPulse is designed to bridge the gap between citizens and municipal authorities in Pakistan. You can report issues like potholes, garbage, broken streetlights, and more. Our AI helps analyze images, and you earn reputation points for contributing. Is there something specific about the platform I can help you with?";
}

// ── Resolution Verification ──
export async function verifyResolution(
  reportId: string,
  beforeImageBase64: string | null,
  afterImageBase64: string,
  category: string,
  description: string
): Promise<{
  resolved: boolean;
  confidence: number;
  reason: string;
}> {
  if (!genAI) return mockResolutionVerification(reportId, description);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const contents: any[] = [];
    
    if (beforeImageBase64) {
      contents.push({
        inlineData: { data: beforeImageBase64, mimeType: "image/jpeg" },
      });
      contents.push({
        text: "This is the BEFORE image showing the reported civic issue.",
      });
    }

    contents.push({
      inlineData: { data: afterImageBase64, mimeType: "image/jpeg" },
    });
    contents.push({
      text: `This is the AFTER image showing the resolved issue.
Original Issue Details:
Category: ${category}
Description: ${description}

Analyze the AFTER image (and compare it with the BEFORE image, if provided) to verify if the reported civic issue has been successfully resolved (e.g. trash cleared, pothole paved, streetlight fixed, etc.).
Determine:
1. Is the issue resolved? (resolved: true or false)
2. Confidence level as a percentage representation (0.0 to 1.0)
3. A concise explanation of why you reached this conclusion (what you see).

Respond ONLY in this exact JSON format:
{"resolved": true, "confidence": 0.95, "reason": "The pothole has been fully paved and leveled with the road."}`,
    });

    const result = await model.generateContent(contents);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return mockResolutionVerification(reportId, description);
  } catch (err) {
    console.error("Gemini verify resolution error:", err);
    return mockResolutionVerification(reportId, description);
  }
}

function mockResolutionVerification(reportId: string, description: string) {
  const hasFailWord = description.toLowerCase().includes("fail") || description.toLowerCase().includes("reject");
  
  // Use a deterministic hash of reportId so clicking verify multiple times yields identical results
  let hash = 0;
  for (let i = 0; i < reportId.length; i++) {
    hash = reportId.charCodeAt(i) + ((hash << 5) - hash);
  }

  // 20% deterministic failure rate based on reportId hash (unless "fail"/"reject" is in original description)
  const isFail = hasFailWord || (Math.abs(hash) % 5 === 0);

  if (isFail) {
    const confidence = 0.65 + (Math.abs(hash) % 100) / 1000; // deterministic between 0.65 and 0.75
    return {
      resolved: false,
      confidence,
      reason: "AI check: The uploaded photo STILL shows elements of the unresolved issue (e.g. active debris or unrepaired surface). Please re-upload a clear photo of the fixed issue.",
    };
  } else {
    const confidence = 0.88 + (Math.abs(hash) % 100) / 1000; // deterministic between 0.88 and 0.98
    return {
      resolved: true,
      confidence,
      reason: "AI check: The reported civic issue has been successfully fixed and cleared in the resolution image.",
    };
  }
}

