export interface InterestConfig {
  tokens: string[];
  opsCategoryIds?: number[];
  foursquareCategories?: string[];
}

const HISTORIC_CATEGORY_IDS = [221, 223, 224, 228, 232, 237, 240];
const CIVIL_WAR_CATEGORY_IDS = [228, 232, 237];
const CULTURE_CATEGORY_IDS = [131, 132, 133, 134, 135, 136];
const SCENIC_CATEGORY_IDS = [279, 280, 621, 622, 627, 340];
const FAMILY_CATEGORY_IDS = [283, 291, 309, 310, 625];
const ENTERTAINMENT_CATEGORY_IDS = [298, 299, 303, 305, 306];
const BREWERY_CATEGORY_IDS = [563, 569, 570];

export const INTEREST_CONFIG: Record<string, InterestConfig> = {
  historical: {
    tokens: [
      'historic',
      'historic.battlefield',
      'historic.fort',
      'historic.memorial',
      'historic.monument',
      'tourism.museum',
      'tourism.information',
      'heritage',
    ],
    opsCategoryIds: HISTORIC_CATEGORY_IDS,
  },
  history: {
    tokens: ['historic', 'historic.memorial', 'tourism.museum', 'heritage'],
    opsCategoryIds: HISTORIC_CATEGORY_IDS,
  },
  civil_war_history: {
    tokens: [
      'historic.battlefield',
      'historic.fort',
      'historic.memorial',
      'tourism.museum',
      'tourism.information',
    ],
    opsCategoryIds: CIVIL_WAR_CATEGORY_IDS,
  },
  american_history: {
    tokens: [
      'historic.battlefield',
      'historic.memorial',
      'historic.monument',
      'tourism.museum',
      'tourism.information',
    ],
    opsCategoryIds: HISTORIC_CATEGORY_IDS,
  },
  cultural: {
    tokens: ['museum', 'gallery', 'culture', 'heritage', 'tourism.museum'],
    opsCategoryIds: CULTURE_CATEGORY_IDS,
  },
  culture: {
    tokens: ['museum', 'gallery', 'tourism.museum'],
    opsCategoryIds: CULTURE_CATEGORY_IDS,
  },
  scenic: {
    tokens: [
      'viewpoint',
      'tourism.viewpoint',
      'nature',
      'nature_reserve',
      'park',
      'natural',
      'mountain',
      'waterfall',
      'lake',
      'panorama',
    ],
    opsCategoryIds: SCENIC_CATEGORY_IDS,
  },
  nature: {
    tokens: ['nature', 'nature_reserve', 'park', 'trail'],
    opsCategoryIds: SCENIC_CATEGORY_IDS,
  },
  entertainment: {
    tokens: ['music', 'concert', 'entertainment', 'nightlife', 'amenity.bar'],
    opsCategoryIds: ENTERTAINMENT_CATEGORY_IDS,
  },
  nightlife: {
    tokens: ['nightlife', 'amenity.bar', 'amenity.pub'],
    opsCategoryIds: ENTERTAINMENT_CATEGORY_IDS,
  },
  family: {
    tokens: ['zoo', 'aquarium', 'family', 'amusement', 'theme_park', 'playground'],
    opsCategoryIds: FAMILY_CATEGORY_IDS,
  },
  breweries: {
    tokens: ['amenity.brewery', 'amenity.pub', 'amenity.bar'],
    opsCategoryIds: BREWERY_CATEGORY_IDS,
  },
  distilleries: {
    tokens: ['craft.distillery', 'amenity.bar', 'amenity.pub'],
  },
  craft_beverages: {
    tokens: ['amenity.brewery', 'craft.distillery', 'amenity.pub', 'amenity.bar', 'shop.wine'],
    opsCategoryIds: BREWERY_CATEGORY_IDS,
  },
};

export const resolveInterestTokens = (interestTags: string[]): string[] => {
  const tokens = new Set<string>();

  interestTags.forEach((tag) => {
    const lower = tag.toLowerCase();
    tokens.add(lower);
    const config = INTEREST_CONFIG[lower];
    config?.tokens.forEach((token) => tokens.add(token.toLowerCase()));
  });

  const expanded = new Set<string>();
  tokens.forEach((token) => {
    expanded.add(token);
    token.split(/[.:/_-]/).forEach((segment) => {
      const trimmed = segment.trim();
      if (trimmed) {
        expanded.add(trimmed);
      }
    });
  });

  return Array.from(expanded);
};

export const resolveOpsCategoryIds = (interestTags: string[]): number[] => {
  const ids = new Set<number>();
  interestTags.forEach((tag) => {
    const lower = tag.toLowerCase();
    const config = INTEREST_CONFIG[lower];
    config?.opsCategoryIds?.forEach((id) => ids.add(id));
  });
  return Array.from(ids);
};
