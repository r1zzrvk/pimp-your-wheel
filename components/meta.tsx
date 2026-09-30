import type { Metadata } from "next";

export const SITE_NAME = "Pimp your wheel";
export const SITE_DESCRIPTION = "Крути колесо, фарми монеты и поднимай уровень.";

type MetaInput = {
  title?: string;
  description?: string;
};

export function meta({ title, description = SITE_DESCRIPTION }: MetaInput = {}): Metadata {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  return {
    title: title ?? { absolute: SITE_NAME },
    description,
    applicationName: SITE_NAME,
    openGraph: {
      title: fullTitle,
      description,
      siteName: SITE_NAME,
      locale: "ru_RU",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
    },
  };
}
