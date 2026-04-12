// ─────────────────────────────────────────────────────────────────────────────
// PAID RESPONSE MODELS
// Comprehensive type definitions for 5 premium categories:
// Vacation, Shopping, Meals, Content, Research
// ─────────────────────────────────────────────────────────────────────────────

export type CategoryId = "vacation" | "shopping" | "meals" | "content" | "research";

// ═════════════════════════════════════════════════════════════════════════════
// SHARED PRIMITIVES
// ═════════════════════════════════════════════════════════════════════════════

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
  label?: string; // e.g. "per night" | "per item" | "per week"
}

export interface MediaItem {
  url: string;
  alt?: string;
  type: "image" | "video_thumbnail";
}

export interface ProsCons {
  pros: string[];
  cons: string[];
}

export interface Tag {
  label: string;
  color?: string;
}

/** Base shape every category response extends */
export interface BasePaidResponse {
  id: string;
  categoryId: CategoryId;
  generatedAt: string; // ISO string
  query: string; // original user prompt
  headline: string;
  subheadline: string;
  isPaid: boolean;
  isUnlocked: boolean;
  totalItems: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. VACATION
// ═════════════════════════════════════════════════════════════════════════════

export interface KeyPlace {
  id: string;
  name: string;
  description: string;
  distanceKm: number;
  walkTimeMinutes: number;
  imageUrl?: string;
  isMust: boolean;
}

export interface TransportOption {
  type: "flight" | "ferry" | "seaplane" | "shuttle" | "private_transfer" | "train" | "bus";
  description: string;
  arrivalAirportCode?: string;
  arrivalAirportCity?: string;
  estimatedCost?: PriceRange;
}

export interface Activity {
  name: string;
  description: string;
  estimatedCost?: PriceRange;
  durationHours?: number;
  tags: string[];
}

export interface VacationBudget {
  accommodationPerNight: PriceRange;
  flightsPerPerson: PriceRange;
  transportPerPerson: PriceRange;
  activitiesPerPerson: PriceRange;
  foodPerPersonPerDay: PriceRange;
  totalEstimatedPerPerson: PriceRange;
  tripDurationNights: number;
}

export interface Destination {
  id: string;
  title: string;
  location: string;
  fullLocationLabel: string;
  distanceKm: number;
  images: MediaItem[];
  rating: number;
  starRating: number;
  resortName: string;
  totalAttractions: number;
  averageTimeHours: number;
  usedByCount: number;
  isMustVisit: boolean;
  bestTimeToVisit: string;
  shortDescription: string;
  fullDescription: string;
  prosAndCons: ProsCons;
  pricing: PriceRange;
  transportOptions: TransportOption[];
  activities: Activity[];
  keyPlaces: KeyPlace[];
  budget: VacationBudget;
  tags: string[];
  isPremium: boolean;
  isUnlocked: boolean;
}

export interface VacationResponseModel extends BasePaidResponse {
  categoryId: "vacation";
  month?: string;
  curatedBy: string;
  destinations: Destination[];
  globalBudget: VacationBudget;
  transportSummary: TransportOption[];
  activitiesSummary: Activity[];
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. SHOPPING
// ═════════════════════════════════════════════════════════════════════════════

export type ShoppingCategory =
  | "electronics" | "fashion" | "home" | "beauty"
  | "gifts" | "accessories" | "fitness" | "other";

export interface ProductSpec {
  label: string;
  value: string;
}

export interface BuyLink {
  platform: string;
  url: string;
  price?: number;
  currency?: string;
  inStock: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  brand: string;
  category: ShoppingCategory;
  images: MediaItem[];
  rating: number;
  reviewCount: number;
  price: PriceRange;
  isOnSale: boolean;
  discountPercent?: number;
  shortDescription: string;
  fullDescription: string;
  specs: ProductSpec[];
  prosAndCons: ProsCons;
  buyLinks: BuyLink[];
  tags: string[];
  isBestPick: boolean;
  isPremium: boolean;
  isUnlocked: boolean;
  rank: number;
}

export interface ShoppingResponseModel extends BasePaidResponse {
  categoryId: "shopping";
  budgetCap?: number;
  budgetCurrency?: string;
  intent: string;
  products: ProductItem[];
  comparisonDimensions: string[];
  editorialSummary: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. MEALS
// ═════════════════════════════════════════════════════════════════════════════

export type DietaryTag =
  | "vegetarian" | "vegan" | "gluten-free" | "high-protein"
  | "low-carb" | "dairy-free" | "keto" | "halal" | "none";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "prep";

export interface Ingredient {
  name: string;
  quantity: string;
  optional: boolean;
}

export interface MealItem {
  id: string;
  name: string;
  mealType: MealType;
  images: MediaItem[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  servings: number;
  caloriesPerServing: number;
  macros: {
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG?: number;
  };
  dietaryTags: DietaryTag[];
  ingredients: Ingredient[];
  steps: string[];
  estimatedCostPerServing: PriceRange;
  shortDescription: string;
  tips?: string;
  isPremium: boolean;
  isUnlocked: boolean;
}

export interface DayPlan {
  dayNumber: number;
  dayLabel: string;
  meals: MealItem[];
  totalCalories: number;
  totalCost: PriceRange;
}

export interface MealPlanSummary {
  totalDays: number;
  totalMeals: number;
  weeklyBudget: PriceRange;
  avgCaloriesPerDay: number;
  primaryGoal: string;
  dietaryProfile: DietaryTag[];
}

export interface MealResponseModel extends BasePaidResponse {
  categoryId: "meals";
  goal: string;
  dietaryTags: DietaryTag[];
  weeklyBudget?: PriceRange;
  days: DayPlan[];
  summary: MealPlanSummary;
  shoppingList: Ingredient[];
  mealPrepTips: string[];
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. CONTENT
// ═════════════════════════════════════════════════════════════════════════════

export type ContentFormat =
  | "post" | "reel" | "carousel" | "newsletter" | "thread"
  | "blog" | "caption" | "ad_copy" | "announcement" | "story";

export type Platform =
  | "instagram" | "linkedin" | "twitter" | "tiktok"
  | "youtube" | "email" | "website" | "whatsapp" | "multi";

export interface ContentItem {
  id: string;
  title: string;
  format: ContentFormat;
  platform: Platform;
  scheduledDate?: string;
  scheduledTime?: string;
  hook: string;
  body: string;
  callToAction: string;
  hashtags?: string[];
  estimatedReach?: string;
  estimatedEngagementRate?: string;
  tone: string;
  wordCount?: number;
  isPremium: boolean;
  isUnlocked: boolean;
  tags: string[];
}

export interface ContentCalendarWeek {
  weekNumber: number;
  theme: string;
  items: ContentItem[];
}

export interface ContentMixItem {
  format: ContentFormat;
  percentage: number;
  rationale: string;
}

export interface ContentResponseModel extends BasePaidResponse {
  categoryId: "content";
  brand?: string;
  niche: string;
  targetAudience: string;
  platforms: Platform[];
  totalDays: number;
  weeks: ContentCalendarWeek[];
  contentMix: ContentMixItem[];
  strategyNotes: string;
  postingSchedule: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. RESEARCH
// ═════════════════════════════════════════════════════════════════════════════

export type ResearchType =
  | "competitive_analysis" | "market_trends" | "swot"
  | "industry_report" | "consumer_behavior" | "gtm_strategy" | "custom";

export interface DataPoint {
  label: string;
  value: string;
  source?: string;
  year?: number;
}

export interface Competitor {
  name: string;
  logoUrl?: string;
  marketShare?: string;
  strengths: string[];
  weaknesses: string[];
  pricingModel?: string;
  targetMarket?: string;
  notableFeature?: string;
}

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface ChartDataset {
  label: string;
  values: number[];
  xLabels: string[];
  chartType: "bar" | "line" | "pie" | "donut";
}

export interface ResearchSection {
  id: string;
  title: string;
  summary: string;
  dataPoints: DataPoint[];
  insights: string[];
  chartData?: ChartDataset[];
  isPremium: boolean;
  isUnlocked: boolean;
}

export interface ResearchSource {
  title: string;
  url?: string;
  publisher?: string;
  publishedAt?: string;
}

export interface ResearchResponseModel extends BasePaidResponse {
  categoryId: "research";
  researchType: ResearchType;
  topic: string;
  geography?: string;
  timeframe?: string;
  executiveSummary: string;
  keyFindings: string[];
  sections: ResearchSection[];
  competitors?: Competitor[];
  swot?: SWOTAnalysis;
  marketSizeData?: DataPoint[];
  trendData?: DataPoint[];
  recommendations: string[];
  sources: ResearchSource[];
}

// ═════════════════════════════════════════════════════════════════════════════
// UNION + DISCRIMINATED TYPE
// ═════════════════════════════════════════════════════════════════════════════

export type PaidResponseModel =
  | VacationResponseModel
  | ShoppingResponseModel
  | MealResponseModel
  | ContentResponseModel
  | ResearchResponseModel;
