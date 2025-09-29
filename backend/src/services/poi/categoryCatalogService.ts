import type { PoiProviderClient } from './poiProviderClient';

export interface PoiCategory {
  categoryId: number;
  osmKey: string;
  osmValue: string;
  label: string;
}

export interface PoiCategoryGroup {
  groupId: number;
  groupName: string;
  categories: PoiCategory[];
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CategoryCatalogService {
  private readonly cache = new Map<string, CacheEntry<PoiCategoryGroup[]>>();
  private readonly cacheKey = 'ops-category-catalog';

  constructor(
    private readonly poiProvider: PoiProviderClient,
    private readonly ttlMs: number = Number(process.env.POI_CATEGORY_CACHE_TTL_MS ?? 900_000),
  ) {}

  async getCatalog(): Promise<PoiCategoryGroup[]> {
    const now = Date.now();
    const cached = this.cache.get(this.cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const rawCatalog = await this.poiProvider.fetchOpsCategoryCatalog();
    const groups = this.transformCatalog(rawCatalog);

    this.cache.set(this.cacheKey, { value: groups, expiresAt: now + this.ttlMs });
    return groups;
  }

  clearCache(): void {
    this.cache.delete(this.cacheKey);
  }

  private transformCatalog(raw: Record<string, unknown>): PoiCategoryGroup[] {
    return Object.entries(raw).map(([groupName, value]) => {
      const group = value as {
        id?: number;
        children?: Record<string, Record<string, number>>;
      };

      const categories: PoiCategory[] = [];
      if (group.children) {
        Object.entries(group.children).forEach(([osmKey, entries]) => {
          Object.entries(entries).forEach(([osmValue, categoryId]) => {
            categories.push({
              categoryId,
              osmKey,
              osmValue,
              label: `${osmKey}.${osmValue}`,
            });
          });
        });
      }

      categories.sort((a, b) => a.label.localeCompare(b.label));

      return {
        groupId: group.id ?? 0,
        groupName,
        categories,
      } satisfies PoiCategoryGroup;
    });
  }
}
