export type Locale = "en" | "ar";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "nav.explore": "Explore",
    "nav.about": "About",
    "nav.category.demographics": "Demographics",
    "nav.category.earth-and-climate": "Earth & Climate",
    "nav.category.history": "History",
    "nav.category.space-and-science": "Space & Science",
    "nav.category.culture": "Culture",
    "artifact.source": "Source",
    "artifact.updated": "Updated",
    "artifact.updatedAgo": "ago",
    "artifact.essay": "About this data",
    "artifact.related": "Related visualizations",
    "artifact.lenses": "Explore angles",
    "artifact.share": "Share",
    "artifact.download": "Download PNG",
    "artifact.copyLink": "Copy link",
    "badge.live": "LIVE",
    "badge.synced": "SYNCED",
    "badge.static": "STATIC",
    "badge.simulated": "SIMULATED",
    "explore.title": "All visualizations",
    "explore.filter.category": "Category",
    "explore.filter.mode": "Data mode",
    "home.featured": "Featured",
    "home.recent": "Recently updated",
    "footer.about": "About",
    "footer.methodology": "Methodology",
    "footer.language": "Language",
    "meta.siteName": "How Does It Look Like",
    "meta.siteDescription": "A curated gallery of live, data-driven visual essays.",
  },
  ar: {
    "nav.explore": "استكشف",
    "nav.about": "حول",
    "nav.category.demographics": "ديموغرافيا",
    "nav.category.earth-and-climate": "الأرض والمناخ",
    "nav.category.history": "التاريخ",
    "nav.category.space-and-science": "الفضاء والعلوم",
    "nav.category.culture": "الثقافة",
    "artifact.source": "المصدر",
    "artifact.updated": "تحديث",
    "artifact.updatedAgo": "مضى",
    "artifact.essay": "حول هذه البيانات",
    "artifact.related": "تصورات ذات صلة",
    "artifact.lenses": "استكشف زوايا",
    "artifact.share": "مشاركة",
    "artifact.download": "تحميل PNG",
    "artifact.copyLink": "نسخ الرابط",
    "badge.live": "مباشر",
    "badge.synced": "متزامن",
    "badge.static": "ثابت",
    "badge.simulated": "محاكاة",
    "explore.title": "جميع التصورات",
    "explore.filter.category": "الفئة",
    "explore.filter.mode": "نمط البيانات",
    "home.featured": "المميزة",
    "home.recent": "محدثة مؤخراً",
    "footer.about": "حول",
    "footer.methodology": "المنهجية",
    "footer.language": "اللغة",
    "meta.siteName": "كيف يبدو؟",
    "meta.siteDescription": "معرض منتقى من المقالات البصرية التفاعلية المدعومة بالبيانات.",
  },
};

export function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? translations["en"][key] ?? key;
}

export function getDir(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function formatTimeAgo(isoDate: string, locale: Locale): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (locale === "ar") {
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  }
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export const CATEGORIES = [
  "demographics",
  "earth-and-climate",
  "history",
  "space-and-science",
  "culture",
] as const;

export type Category = (typeof CATEGORIES)[number];
