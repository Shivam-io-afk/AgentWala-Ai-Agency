import { formatDateIST, formatDateTimeIST, formatRupees } from "./formatters";
import { loadState, saveState } from "./storage";
export { formatDateIST, formatDateTimeIST, formatRupees };

interface ClockData {
  offset_ms: number; // offset relative to real time Date.now()
  frozen_at?: string; // if frozen at a specific timestamp
}

let memoryClock: ClockData = { offset_ms: 0 };

// Eagerly sync clock state from storage in background
if (typeof window === "undefined") {
  loadState<ClockData>("clock")
    .then((data) => {
      if (data) {
        memoryClock = data;
      }
    })
    .catch((err) => {
      console.error("[clock] Initial load error:", err);
    });
}

/**
 * Explicitly refresh clock data from persistent storage (e.g. before returning dev clock API)
 */
export async function syncClockFromStorage(): Promise<ClockData> {
  try {
    const data = await loadState<ClockData>("clock");
    if (data) {
      memoryClock = data;
    }
  } catch (err) {
    console.error("[clock] Sync error:", err);
  }
  return memoryClock;
}

function getClockData(): ClockData {
  return memoryClock;
}

function saveClockData(data: ClockData): void {
  memoryClock = data;
  saveState("clock", data).catch((e) => {
    console.error("[clock] Failed to save clock data:", e);
  });
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

/**
 * Returns current hour (0-23) in Indian Standard Time (IST)
 */
export function getAppISTHour(): number {
  const appDate = getAppDate();
  const utcHours = appDate.getUTCHours();
  const utcMinutes = appDate.getUTCMinutes();
  return (utcHours + 5 + Math.floor((utcMinutes + 30) / 60)) % 24;
}
