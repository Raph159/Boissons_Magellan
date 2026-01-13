import fs from "fs";
import path from "path";

const SLUG_PATH = process.env.PRODUCT_SLUG_PATH || path.resolve("data/product_slugs.json");

type SlugMap = Record<string, string>;

function ensureDir() {
  fs.mkdirSync(path.dirname(SLUG_PATH), { recursive: true });
}

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function loadProductSlugs(): SlugMap {
  try {
    const raw = fs.readFileSync(SLUG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as SlugMap;
  } catch {
    return {};
  }
}

export function saveProductSlugs(slugs: SlugMap) {
  ensureDir();
  fs.writeFileSync(SLUG_PATH, JSON.stringify(slugs, null, 2), "utf8");
}

export function setProductSlug(productId: number, slug: string | null) {
  const slugs = loadProductSlugs();
  if (slug) {
    slugs[String(productId)] = slug;
  } else {
    delete slugs[String(productId)];
  }
  saveProductSlugs(slugs);
}
