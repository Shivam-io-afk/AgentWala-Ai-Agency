import { clinicsContent } from "@/content/clinics";
import { LandingPage } from "@/components/landing-page";
import { db } from "@/lib/db";

export default async function HomePage() {
  const settings = await db.getSettings();
  return <LandingPage content={clinicsContent} initialSettings={settings} />;
}

