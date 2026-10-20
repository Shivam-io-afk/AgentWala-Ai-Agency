import fs from "fs";
import path from "path";

import { formatDateIST, formatDateTimeIST, formatRupees } from "./formatters";
export { formatDateIST, formatDateTimeIST, formatRupees };

const DATA_DIR = path.join(process.cwd(), ".data");
const CLOCK_FILE = path.join(DATA_DIR, "clock.json");

interface ClockData {
  offset_ms: number; // offset relative to real time Date.now()
  frozen_at?: string; // if frozen at a specific timestamp
}

function getClockData(): ClockData {
  try {
    if (fs.existsSync(CLOCK_FILE)) {
      const raw = fs.readFileSync(CLOCK_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {
    // fallback
  }
  return { offset_ms: 0 };
}

function saveClockData(data: ClockData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CLOCK_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save clock data:", e);
  }
}

/**
 * Returns the current virtual App Date, taking into account dev time travel offset
 */
export function getAppDate(): Date {
  const data = getClockData();
  if (data.frozen_at) {
    return new Date(data.frozen_at);
  }
  return new Date(Date.now() + (data.offset_ms || 0));
}

export function getAppTimeISO(): string {
  return getAppDate().toISOString();
}

/**
 * Returns formatted IST timestamp string (Asia/Kolkata)
 */
export function getAppTimeIST(dateObj?: Date): string {
  const d = dateObj || getAppDate();
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Dev Time Travel controls
 */
export function advanceAppTime(ms: number): { currentISO: string; currentIST: string; offset_ms: number } {
  const data = getClockData();
  data.offset_ms = (data.offset_ms || 0) + ms;
  data.frozen_at = undefined;
  saveClockData(data);
  return {
    currentISO: getAppTimeISO(),
    currentIST: getAppTimeIST(),
    offset_ms: data.offset_ms,
  };
}

export function setAppTime(isoString: string): { currentISO: string; currentIST: string; offset_ms: number } {
  const target = new Date(isoString).getTime();
  const now = Date.now();
  const offset_ms = target - now;
  const data: ClockData = { offset_ms };
  saveClockData(data);
  return {
    currentISO: getAppTimeISO(),
    currentIST: getAppTimeIST(),
    offset_ms,
  };
}

export function resetAppTime(): { currentISO: string; currentIST: string; offset_ms: number } {
  const data: ClockData = { offset_ms: 0 };
  saveClockData(data);
  return {
    currentISO: getAppTimeISO(),
    currentIST: getAppTimeIST(),
    offset_ms: 0,
  };
}

export function getAppISTHour(dateObj?: Date): number {
  const d = dateObj || getAppDate();
  const istStr = d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false });
  return parseInt(istStr, 10);
}


