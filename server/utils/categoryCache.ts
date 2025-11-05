import { Db } from "mongodb";

let cachedCategories: any[] | null = null;
let cacheTs = 0;
const TTL = 60 * 1000; // 60 seconds

export async function getCachedCategories(db: Db) {
  const now = Date.now();
  if (cachedCategories && now - cacheTs < TTL) {
    return { fromCache: true, data: cachedCategories };
  }

  const categories = await db
    .collection("categories")
    .find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .toArray();

  cachedCategories = categories;
  cacheTs = Date.now();

  return { fromCache: false, data: categories };
}

export function clearCategoriesCache() {
  cachedCategories = null;
  cacheTs = 0;
}
