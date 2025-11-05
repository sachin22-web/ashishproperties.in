import nodemailer from "nodemailer";
import { getDatabase } from "../db/mongodb";

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedConfigHash = "";

async function loadEmailConfig() {
  try {
    const db = getDatabase();
    const settings = await db.collection("admin_settings").findOne({});
    const cfg = settings?.email || {};
    const host = cfg.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(cfg.smtpPort || process.env.SMTP_PORT || 587);
    const user =
      cfg.smtpUsername ||
      process.env.SMTP_USERNAME ||
      process.env.SMTP_USER ||
      "";
    const pass =
      cfg.smtpPassword ||
      process.env.SMTP_PASSWORD ||
      process.env.SMTP_PASS ||
      "";
    const from =
      cfg.fromEmail || process.env.SMTP_FROM || user || "no-reply@localhost";
    return { host, port, user, pass, from };
  } catch {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USERNAME || process.env.SMTP_USER || "";
    const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "";
    const from = process.env.SMTP_FROM || user || "no-reply@localhost";
    return { host, port, user, pass, from };
  }
}

function configHash(c: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}) {
  return `${c.host}:${c.port}:${c.user}:${c.from}:${passMask(c.pass)}`;
}
function passMask(p: string) {
  return p ? String(p).slice(0, 2) + "***" : "";
}

export async function getTransporter() {
  const cfg = await loadEmailConfig();
  const isDev = process.env.NODE_ENV !== "production";
  const hasAuth = Boolean(cfg.user) && Boolean(cfg.pass);

  const hash =
    configHash(cfg) +
    `:${isDev ? "dev" : "prod"}:${hasAuth ? "auth" : "noauth"}`;
  if (cachedTransporter && cachedConfigHash === hash)
    return { transporter: cachedTransporter, from: cfg.from };

  cachedConfigHash = hash;

  // If we are in dev or logging mode and no SMTP credentials are configured,
  // use a JSON transport that does not send real email but succeeds.
  const useJsonTransport =
    isDev &&
    (!hasAuth || String(process.env.EMAIL_MODE || "").toLowerCase() === "log");

  if (useJsonTransport) {
    cachedTransporter = nodemailer.createTransport({ jsonTransport: true });
    return { transporter: cachedTransporter, from: cfg.from };
  }

  cachedTransporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: hasAuth ? { user: cfg.user, pass: cfg.pass } : undefined,
  });
  return { transporter: cachedTransporter, from: cfg.from };
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string,
) {
  const { transporter, from } = await getTransporter();
  try {
    const info = await transporter.sendMail({ from, to, subject, html, text });
    return info;
  } catch (err) {
    // In development, do not fail hard if email cannot be sent
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[DEV] Email send failed, logging instead:", {
        to,
        subject,
      });
      // Simulate nodemailer info object
      return { messageId: "dev-log", accepted: [], rejected: [to] } as any;
    }
    throw err;
  }
}
