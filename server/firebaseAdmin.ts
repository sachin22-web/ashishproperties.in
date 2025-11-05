// server/firebaseAdmin.ts
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

function readJsonFileSafe(p: string): any | null {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function normalizeSvc(svc: any | null): any | null {
  if (!svc) return null;
  if (svc.private_key) {
    // handle both escaped and real newlines
    const k = String(svc.private_key);
    svc.private_key = k.includes("\\n") ? k.replace(/\\n/g, "\n") : k;
  }
  return svc;
}

function looksLikePem(key?: string) {
  if (!key) return false;
  return key.includes("BEGIN PRIVATE KEY") && key.includes("END PRIVATE KEY");
}

function resolveServiceAccount(): any {
  // 1) Prefer explicit PATH (most reliable)
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (envPath) {
    const parsed = readJsonFileSafe(envPath);
    if (parsed) {
      const norm = normalizeSvc(parsed);
      if (!looksLikePem(norm?.private_key)) {
        throw new Error(
          `Service account at ${envPath} has invalid private_key format.`,
        );
      }
      console.log("[FB-ADMIN] Using credentials from PATH:", envPath);
      return norm;
    }
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT_PATH provided but file unreadable: ${envPath}`,
    );
  }

  // 2) GOOGLE_APPLICATION_CREDENTIALS
  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gac) {
    const parsed = readJsonFileSafe(gac);
    if (parsed) {
      const norm = normalizeSvc(parsed);
      if (!looksLikePem(norm?.private_key)) {
        throw new Error(
          `Service account at GOOGLE_APPLICATION_CREDENTIALS has invalid private_key format.`,
        );
      }
      console.log("[FB-ADMIN] Using credentials from GAC:", gac);
      return norm;
    }
  }

  // 3) INLINE JSON (fallback; easy to mess up)
  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envJson) {
    try {
      const parsed = JSON.parse(envJson);
      const norm = normalizeSvc(parsed);
      if (!looksLikePem(norm?.private_key)) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT private_key has bad format.");
      }
      console.warn(
        "[FB-ADMIN] Using INLINE service account (avoid in dev; prefer PATH).",
      );
      return norm;
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT is not valid JSON. Keep \\n as escaped in private_key.",
      );
    }
  }

  // 4) Local dev default
  const defaultPath = path.resolve(
    process.cwd(),
    "server/credentials/firebase-service-account.json",
  );
  const parsed = readJsonFileSafe(defaultPath);
  if (parsed) {
    const norm = normalizeSvc(parsed);
    if (!looksLikePem(norm?.private_key)) {
      throw new Error(
        `Service account at default path has invalid private_key format.`,
      );
    }
    console.log("[FB-ADMIN] Using credentials from default path:", defaultPath);
    return norm;
  }

  throw new Error(
    "Missing Firebase service account. Provide FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS, or place server/credentials/firebase-service-account.json",
  );
}

let _ready = false;

export function getAdmin(): typeof admin {
  if (_ready && admin.apps.length > 0) return admin;

  const svc = resolveServiceAccount();

  const projectId =
    svc.project_id ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      "Firebase projectId not found. Ensure service account has project_id OR set FIREBASE_PROJECT_ID / VITE_FIREBASE_PROJECT_ID.",
    );
  }
  if (!svc.client_email || !svc.private_key) {
    throw new Error("Service account missing client_email/private_key.");
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail: svc.client_email,
        privateKey: svc.private_key,
      }),
    });
    console.log("[FB-ADMIN] Initialized for project:", projectId);
  }

  _ready = true;
  return admin;
}
