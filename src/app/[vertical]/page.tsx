import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVerticalContent, verticalExists } from "@/content";
import { LandingPage } from "@/components/landing-page";
import { db } from "@/lib/db";

interface VerticalPageProps {
  params: Promise<{
    vertical: string;
  }>;
}

export async function generateMetadata({
  params,
}: VerticalPageProps): Promise<Metadata> {
  const { vertical } = await params;
  if (vertical !== "clinics" && !verticalExists(vertical)) {
    return {
      title: "Page Not Found · AgentWala",
    };
  }
  const content = getVerticalContent(vertical);

  return {
    title: content.seoTitle,
    description: content.seoDescription,
    openGraph: {
      title: content.seoTitle,
      description: content.seoDescription,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: content.seoTitle,
        },
      ],
    },
  };
}

export default async function VerticalPage({ params }: VerticalPageProps) {
  const { vertical } = await params;

  if (vertical !== "clinics" && !verticalExists(vertical)) {
    notFound();
  }

  const content = getVerticalContent(vertical);
  const settings = await db.getSettings();
  return <LandingPage content={content} initialSettings={settings} />;
}

