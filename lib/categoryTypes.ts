export const SUPPORTED_CATEGORIES = [
  "Technology",
  "AI",
  "Startups",
  "Gaming",
  "Cybersecurity",
  "Science",
] as const;

export type Category = (typeof SUPPORTED_CATEGORIES)[number];

export const DEFAULT_CATEGORY: Category = "Technology";

const categoryKeywords: Record<Category, string[]> = {
  Technology: ["technology", "tech", "software", "hardware", "digital", "gadget"],
  AI: ["ai", "artificial intelligence", "machine learning", "llm", "openai", "model"],
  Startups: ["startup", "startups", "funding", "venture", "founder", "seed"],
  Gaming: ["gaming", "game", "games", "console", "esports", "playstation", "xbox"],
  Cybersecurity: ["cybersecurity", "security", "breach", "malware", "hack", "privacy"],
  Science: ["science", "space", "research", "physics", "biology", "climate"],
};

export function isCategory(value: string): value is Category {
  return SUPPORTED_CATEGORIES.includes(value as Category);
}

export function normalizeCategory(value?: string | null): Category {
  if (!value) {
    return DEFAULT_CATEGORY;
  }

  const match = SUPPORTED_CATEGORIES.find(
    (category) => category.toLowerCase() === value.toLowerCase(),
  );

  return match ?? DEFAULT_CATEGORY;
}

export function inferCategoryFromText(...values: Array<string | null | undefined>): Category {
  const text = values.filter(Boolean).join(" ").toLowerCase();

  for (const category of SUPPORTED_CATEGORIES) {
    if (categoryKeywords[category].some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return DEFAULT_CATEGORY;
}
