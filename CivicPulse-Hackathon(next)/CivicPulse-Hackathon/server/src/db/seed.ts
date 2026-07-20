import { db, initializeDatabase } from "./index.js";
import { users, departments, badges, reports, reportImages, notifications } from "./schema.js";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function seed() {
  initializeDatabase();

  const now = new Date().toISOString();

  // Check if already seeded
  const existingUsers = db.select().from(users).all();
  if (existingUsers.length > 0) {
    console.log("⚠️  Database already seeded. Skipping.");
    return;
  }

  // ── Seed Badges ──
  const badgeData = [
    { id: uuid(), name: "First Voice", description: "Filed your first report", icon: "megaphone", requirement: "File 1 report", threshold: 1, type: "reports_filed" as const },
    { id: uuid(), name: "Active Reporter", description: "Filed 5 reports", icon: "file-text", requirement: "File 5 reports", threshold: 5, type: "reports_filed" as const },
    { id: uuid(), name: "Top Reporter", description: "Filed 10+ verified reports", icon: "award", requirement: "Have 10 resolved reports", threshold: 10, type: "reports_resolved" as const },
    { id: uuid(), name: "Civic Hero", description: "Filed 50+ verified reports", icon: "shield", requirement: "File 50 reports", threshold: 50, type: "reports_filed" as const },
    { id: uuid(), name: "Community Guardian", description: "Supported 100+ reports", icon: "heart", requirement: "Upvote 100 reports", threshold: 100, type: "upvotes_given" as const },
    { id: uuid(), name: "Rising Star", description: "Earned 500+ reputation", icon: "star", requirement: "Reach 500 reputation", threshold: 500, type: "reputation" as const },
    { id: uuid(), name: "Legend", description: "Earned 2000+ reputation", icon: "crown", requirement: "Reach 2000 reputation", threshold: 2000, type: "reputation" as const },
  ];
  for (const b of badgeData) {
    db.insert(badges).values(b).run();
  }
  console.log("✅ Badges seeded");

  // ── Seed Departments ──
  const deptData = [
    { id: uuid(), name: "Roads & Infrastructure — Lahore", city: "Lahore", category: "Pothole", description: "Handles road maintenance, potholes, and surface damage in Lahore", createdAt: now },
    { id: uuid(), name: "Roads & Infrastructure — Karachi", city: "Karachi", category: "Road Damage", description: "Handles road maintenance in Karachi", createdAt: now },
    { id: uuid(), name: "Solid Waste — Lahore", city: "Lahore", category: "Garbage", description: "LWMC garbage collection and disposal", createdAt: now },
    { id: uuid(), name: "Solid Waste — Karachi", city: "Karachi", category: "Garbage", description: "KWMC garbage and sanitation services", createdAt: now },
    { id: uuid(), name: "WASA Lahore", city: "Lahore", category: "Water Issue", description: "Water supply and drainage in Lahore", createdAt: now },
    { id: uuid(), name: "K-Electric Streetlights", city: "Karachi", category: "Streetlight", description: "Streetlight and power infrastructure in Karachi", createdAt: now },
    { id: uuid(), name: "LESCO Streetlights", city: "Lahore", category: "Streetlight", description: "Streetlight maintenance in Lahore", createdAt: now },
    { id: uuid(), name: "Anti-Encroachment — Rawalpindi", city: "Rawalpindi", category: "Encroachment", description: "Anti-encroachment operations in Rawalpindi", createdAt: now },
    { id: uuid(), name: "CDA Infrastructure", city: "Islamabad", category: "Pothole", description: "Capital Development Authority infrastructure", createdAt: now },
    { id: uuid(), name: "CDA Sanitation", city: "Islamabad", category: "Garbage", description: "CDA sanitation and waste management", createdAt: now },
  ];
  for (const d of deptData) {
    db.insert(departments).values(d).run();
  }
  console.log("✅ Departments seeded");

  // ── Seed Users ──
  const passwordHash = await bcrypt.hash("password", 10);

  const adminId = uuid();
  const officerId = uuid();
  const citizen1Id = uuid();
  const citizen2Id = uuid();
  const citizen3Id = uuid();
  const citizen4Id = uuid();
  const citizen5Id = uuid();

  const userData = [
    { id: adminId, name: "Admin", email: "admin@civicpulse.com", passwordHash, role: "admin" as const, city: "Islamabad", avatarInitial: "A", reputation: 0, reportsCount: 0, resolvedCount: 0, supportedCount: 0, createdAt: now },
    { id: officerId, name: "Officer Ali", email: "officer@civicpulse.com", passwordHash, role: "officer" as const, city: "Lahore", avatarInitial: "O", reputation: 0, reportsCount: 0, resolvedCount: 0, supportedCount: 0, departmentId: deptData[0].id, createdAt: now },
    { id: citizen1Id, name: "Aisha Khan", email: "aisha@example.com", passwordHash, role: "citizen" as const, city: "Karachi", avatarInitial: "A", reputation: 1240, reportsCount: 52, resolvedCount: 39, supportedCount: 188, createdAt: "2025-09-15T10:00:00.000Z" },
    { id: citizen2Id, name: "Bilal Ahmed", email: "bilal@example.com", passwordHash, role: "citizen" as const, city: "Islamabad", avatarInitial: "B", reputation: 880, reportsCount: 31, resolvedCount: 22, supportedCount: 96, createdAt: "2025-11-01T10:00:00.000Z" },
    { id: citizen3Id, name: "Fatima Noor", email: "fatima@example.com", passwordHash, role: "citizen" as const, city: "Lahore", avatarInitial: "F", reputation: 540, reportsCount: 19, resolvedCount: 11, supportedCount: 74, createdAt: "2026-01-10T10:00:00.000Z" },
    { id: citizen4Id, name: "Omar Sheikh", email: "omar@example.com", passwordHash, role: "citizen" as const, city: "Rawalpindi", avatarInitial: "O", reputation: 410, reportsCount: 14, resolvedCount: 8, supportedCount: 45, createdAt: "2026-02-20T10:00:00.000Z" },
    { id: citizen5Id, name: "Zara Malik", email: "zara@example.com", passwordHash, role: "citizen" as const, city: "Faisalabad", avatarInitial: "Z", reputation: 290, reportsCount: 9, resolvedCount: 5, supportedCount: 32, createdAt: "2026-03-05T10:00:00.000Z" },
  ];
  for (const u of userData) {
    db.insert(users).values(u).run();
  }
  console.log("✅ Users seeded");

  // ── Seed Reports ──
  const reportData = [
    { id: uuid(), title: "Pothole cluster — Band Road crossing", description: "Multiple deep potholes near the Band Road crossing. Dangerous for two-wheelers, especially at night. Several accidents reported.", city: "Lahore", area: "Band Road", category: "Pothole", severity: "high", priority: "P2 High", status: "Submitted" as const, authorId: citizen1Id, authorName: "Aisha Khan", upvoteCount: 1, createdAt: "2026-07-20T09:00:00.000Z", updatedAt: "2026-07-20T09:00:00.000Z" },
    { id: uuid(), title: "Encroachment on pedestrian sidewalk", description: "Shop owners have extended their displays onto the sidewalk, forcing pedestrians to walk on the road.", city: "Rawalpindi", area: "Commercial Market", category: "Encroachment", severity: "medium", priority: "P3 Medium", status: "Submitted" as const, authorId: citizen4Id, authorName: "Omar Sheikh", upvoteCount: 1, createdAt: "2026-07-19T09:00:00.000Z", updatedAt: "2026-07-19T09:00:00.000Z" },
    { id: uuid(), title: "Cracked road surface — Gulshan Ramp", description: "Large cracks have appeared on the Gulshan ramp road surface near the interchange.", city: "Karachi", area: "Gulshan", category: "Road Damage", severity: "low", priority: "P4 Low", status: "Submitted" as const, authorId: citizen5Id, authorName: "Zara Malik", upvoteCount: 0, createdAt: "2026-07-19T08:00:00.000Z", updatedAt: "2026-07-19T08:00:00.000Z" },
    { id: uuid(), title: "Garbage mountain near Tariq Road", description: "A massive pile of uncollected garbage has been building up near Tariq Road for over a week. Strong odor and health hazard.", city: "Karachi", area: "Tariq Road", category: "Garbage", severity: "critical", priority: "P1 Critical", status: "Under Review" as const, authorId: citizen1Id, authorName: "Aisha Khan", upvoteCount: 3, createdAt: "2026-07-18T09:00:00.000Z", updatedAt: "2026-07-19T12:00:00.000Z" },
    { id: uuid(), title: "Streetlight flickering — whole block", description: "All streetlights on Satellite Town Block B have been flickering for 3 days. Very unsafe at night.", city: "Rawalpindi", area: "Satellite Town", category: "Streetlight", severity: "low", priority: "P4 Low", status: "Under Review" as const, authorId: citizen4Id, authorName: "Omar Sheikh", upvoteCount: 1, createdAt: "2026-07-17T09:00:00.000Z", updatedAt: "2026-07-18T14:00:00.000Z" },
    { id: uuid(), title: "Burst water pipe — DHA Phase 6", description: "A major water pipe burst on the main road of DHA Phase 6. Water is flooding the road and nearby houses.", city: "Lahore", area: "DHA Phase 6", category: "Water Issue", severity: "high", priority: "P2 High", status: "Assigned" as const, authorId: citizen3Id, authorName: "Fatima Noor", assignedDeptId: deptData[4].id, upvoteCount: 2, createdAt: "2026-07-16T09:00:00.000Z", updatedAt: "2026-07-17T10:00:00.000Z" },
    { id: uuid(), title: "Missing traffic sign after accident", description: "Traffic sign was knocked over by an accident and hasn't been replaced.", city: "Islamabad", area: "I-8 Markaz", category: "Road Damage", severity: "medium", priority: "P3 Medium", status: "Resolved" as const, authorId: citizen2Id, authorName: "Bilal Ahmed", upvoteCount: 4, resolvedAt: "2026-07-18T10:00:00.000Z", createdAt: "2026-07-14T09:00:00.000Z", updatedAt: "2026-07-18T10:00:00.000Z" },
    { id: uuid(), title: "Streetlight out on entire street", description: "All streetlights on F-11/2 main road are non-functional.", city: "Islamabad", area: "F-11/2", category: "Streetlight", severity: "medium", priority: "P3 Medium", status: "Resolved" as const, authorId: citizen2Id, authorName: "Bilal Ahmed", upvoteCount: 2, resolvedAt: "2026-07-19T10:00:00.000Z", createdAt: "2026-07-15T09:00:00.000Z", updatedAt: "2026-07-19T10:00:00.000Z" },
    { id: uuid(), title: "Overgrown trees blocking visibility", description: "Trees at the intersection are overgrown and blocking road signs and visibility.", city: "Lahore", area: "Model Town", category: "Encroachment", severity: "low", priority: "P4 Low", status: "Resolved" as const, authorId: citizen3Id, authorName: "Fatima Noor", upvoteCount: 1, resolvedAt: "2026-07-17T10:00:00.000Z", createdAt: "2026-07-10T09:00:00.000Z", updatedAt: "2026-07-17T10:00:00.000Z" },
    { id: uuid(), title: "Illegal dumping behind commercial plaza", description: "Construction waste and garbage being dumped behind the commercial plaza at D Ground.", city: "Faisalabad", area: "D Ground", category: "Garbage", severity: "medium", priority: "P3 Medium", status: "Resolved" as const, authorId: citizen5Id, authorName: "Zara Malik", upvoteCount: 3, resolvedAt: "2026-07-16T10:00:00.000Z", createdAt: "2026-07-08T09:00:00.000Z", updatedAt: "2026-07-16T10:00:00.000Z" },
    { id: uuid(), title: "Broken drain cover on Mall Road", description: "A drain cover is missing on Mall Road near Anarkali. Pedestrians at risk.", city: "Lahore", area: "Mall Road", category: "Water Issue", severity: "critical", priority: "P1 Critical", status: "In Progress" as const, authorId: citizen3Id, authorName: "Fatima Noor", assignedDeptId: deptData[4].id, assignedOfficerId: officerId, upvoteCount: 5, createdAt: "2026-07-12T09:00:00.000Z", updatedAt: "2026-07-19T10:00:00.000Z" },
    { id: uuid(), title: "Sewage overflow near school", description: "Sewage water is overflowing near a primary school in Gulberg.", city: "Lahore", area: "Gulberg", category: "Water Issue", severity: "critical", priority: "P1 Critical", status: "Assigned" as const, authorId: citizen1Id, authorName: "Aisha Khan", assignedDeptId: deptData[4].id, assignedOfficerId: officerId, upvoteCount: 7, createdAt: "2026-07-13T09:00:00.000Z", updatedAt: "2026-07-18T10:00:00.000Z" },
  ];
  // Copy generated civic images to uploads directory
  const artifactDir = "C:\\Users\\Hp\\.gemini\\antigravity-ide\\brain\\5c471f86-8f66-40ce-b8fb-65328138448f";
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  try {
    const files = fs.readdirSync(artifactDir);
    const mappings: Record<string, string> = {
      pothole: "pothole_before.png",
      garbage: "garbage_before.png",
      streetlight: "streetlight_before.png",
      water: "water_before.png"
    };

    for (const file of files) {
      for (const [key, targetName] of Object.entries(mappings)) {
        if (file.startsWith(key) && file.endsWith(".png")) {
          const srcPath = path.join(artifactDir, file);
          const destPath = path.join(uploadsDir, targetName);
          fs.copyFileSync(srcPath, destPath);
          console.log(`Copied ${file} -> ${targetName}`);
        }
      }
    }
  } catch (err) {
    console.error("Failed to copy generated seed images:", err);
  }

  for (const r of reportData) {
    db.insert(reports).values(r).run();

    // Map appropriate photos for each report type
    let imgUrl = "";
    if (r.category === "Pothole" || r.category === "Road Damage") {
      imgUrl = "/uploads/pothole_before.png";
    } else if (r.category === "Garbage") {
      imgUrl = "/uploads/garbage_before.png";
    } else if (r.category === "Streetlight") {
      imgUrl = "/uploads/streetlight_before.png";
    } else if (r.category === "Water Issue") {
      imgUrl = "/uploads/water_before.png";
    }

    if (imgUrl) {
      db.insert(reportImages).values({
        id: uuid(),
        reportId: r.id,
        url: imgUrl,
        type: "before",
        createdAt: r.createdAt
      }).run();
    }
  }
  console.log("✅ Reports seeded with matching images");

  // ── Seed Notifications ──
  const notifData = [
    { id: uuid(), userId: citizen1Id, title: "Report Under Review", message: "Your report 'Garbage mountain near Tariq Road' is now under review.", type: "status_update" as const, relatedReportId: reportData[3].id, isRead: false, createdAt: "2026-07-19T12:00:00.000Z" },
    { id: uuid(), userId: citizen3Id, title: "Report Assigned", message: "Your report 'Burst water pipe — DHA Phase 6' has been assigned to WASA Lahore.", type: "assignment" as const, relatedReportId: reportData[5].id, isRead: false, createdAt: "2026-07-17T10:00:00.000Z" },
    { id: uuid(), userId: citizen1Id, title: "New Upvote!", message: "Someone upvoted your report 'Garbage mountain near Tariq Road'.", type: "upvote" as const, relatedReportId: reportData[3].id, isRead: true, createdAt: "2026-07-18T15:00:00.000Z" },
  ];
  for (const n of notifData) {
    db.insert(notifications).values(n).run();
  }
  console.log("✅ Notifications seeded");

  console.log("\n🎉 Database seeded successfully!");
  console.log("   Admin:   admin@civicpulse.com / password");
  console.log("   Officer: officer@civicpulse.com / password");
  console.log("   Citizen: aisha@example.com / password");
}

seed().catch(console.error);
