import { clinicsContent, VerticalContent } from "./clinics";
import { salonsContent } from "./salons";

export const VERTICALS: Record<string, VerticalContent> = {
  clinics: clinicsContent,
  salons: salonsContent,
};

export function getVerticalContent(slug?: string): VerticalContent {
  if (!slug || slug === "index" || slug === "home") {
    return clinicsContent;
  }
  const normalized = slug.toLowerCase();
  if (VERTICALS[normalized]) {
    return VERTICALS[normalized];
  }
  return clinicsContent;
}

export function verticalExists(slug: string): boolean {
  return Boolean(VERTICALS[slug.toLowerCase()]);
}

export * from "./clinics";
export * from "./site";

