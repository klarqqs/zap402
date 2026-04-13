// ─────────────────────────────────────────────────────────────────────────────
// PAID RESPONSE PARSER
// Extracts JSON, validates, casts to correct type, and maps each category to
// ResultCard[] for display in the UI
// ─────────────────────────────────────────────────────────────────────────────

import type {
  CategoryId,
  PaidResponseModel,
  VacationResponseModel,
  ShoppingResponseModel,
  MealResponseModel,
  ContentResponseModel,
  ResearchResponseModel,
  Destination,
  ProductItem,
  DayPlan,
  ContentCalendarWeek,
  ResearchSection,
} from "@/types/PaidResponseModels";
import type { ResultCard } from "@/state/chatStore";

// ─────────────────────────────────────────────────────────────────────────────
// JSON EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractJSON(raw: string): string | null {
  // 1. Try ```json ... ``` fence
  const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1].trim();

  // 2. Try bare ``` ... ```
  const bareFenced = raw.match(/```\s*([\s\S]*?)\s*```/);
  if (bareFenced) return bareFenced[1].trim();

  // 3. Try first complete top-level { ... }
  const firstBrace = raw.indexOf("{");
  if (firstBrace !== -1) {
    let depth = 0;
    for (let i = firstBrace; i < raw.length; i++) {
      if (raw[i] === "{") depth++;
      else if (raw[i] === "}") {
        depth--;
        if (depth === 0) return raw.slice(firstBrace, i + 1);
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY DETECTOR
// ─────────────────────────────────────────────────────────────────────────────

function detectCategory(parsed: Record<string, unknown>): CategoryId | null {
  if (parsed.categoryId && typeof parsed.categoryId === "string") {
    // Normalize aliases the model might return
    const id = parsed.categoryId as string;
    if (id === "travel" || id === "vacation") return "vacation";
    if (id === "shopping" || id === "products") return "shopping";
    if (id === "meals" || id === "meal" || id === "food") return "meals";
    if (id === "content" || id === "contentCalendar") return "content";
    if (id === "research" || id === "analysis") return "research";
    return id as CategoryId;
  }
  // Heuristic fallback
  if ("destinations" in parsed) return "vacation";
  if ("products" in parsed) return "shopping";
  if ("days" in parsed) return "meals";
  if ("weeks" in parsed) return "content";
  if ("sections" in parsed) return "research";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY MAPPERS: Model → ResultCard[]
// ─────────────────────────────────────────────────────────────────────────────

function mapVacationToCards(model: VacationResponseModel): ResultCard[] {
  return model.destinations.map((d: Destination) => ({
    id: d.id,
    title: d.title,
    subtitle: `${d.fullLocationLabel} · ${d.starRating}★ · ${d.resortName}`,
    price: `$${d.pricing.min.toLocaleString()}–$${d.pricing.max.toLocaleString()} / night`,
    details: buildVacationDetail(d),
    imageUrl: d.images[0]?.url,
    meta: {
      categoryId: "vacation" as CategoryId,
      rating: d.rating,
      distanceKm: d.distanceKm,
      totalAttractions: d.totalAttractions,
      averageTimeHours: d.averageTimeHours,
      usedByCount: d.usedByCount,
      isMustVisit: d.isMustVisit,
      bestTimeToVisit: d.bestTimeToVisit,
      prosAndCons: d.prosAndCons,
      activities: d.activities,
      keyPlaces: d.keyPlaces,
      transportOptions: d.transportOptions,
      budget: d.budget,
      tags: d.tags,
      fullDescription: d.fullDescription,
    },
  }));
}

function buildVacationDetail(d: Destination): string {
  const lines: string[] = [
    d.fullDescription,
    "",
    `📍 Best time to visit: ${d.bestTimeToVisit}`,
    `⭐ Resort: ${d.resortName} (${d.starRating}-star)`,
    `🏄 Attractions: ${d.totalAttractions} | Avg stay: ${d.averageTimeHours}h`,
    "",
    "✅ Pros:",
    ...d.prosAndCons.pros.map((p) => `  · ${p}`),
    "",
    "❌ Cons:",
    ...d.prosAndCons.cons.map((c) => `  · ${c}`),
    "",
    "🎯 Top Activities:",
    ...d.activities.slice(0, 3).map(
      (a) =>
        `  · ${a.name} — ${a.description}${a.estimatedCost ? ` ($${a.estimatedCost.min}–$${a.estimatedCost.max})` : ""}`
    ),
    "",
    "💰 Budget (per person):",
    `  · Accommodation: $${d.budget.accommodationPerNight.min}–$${d.budget.accommodationPerNight.max}/night`,
    `  · Flights: $${d.budget.flightsPerPerson.min}–$${d.budget.flightsPerPerson.max}`,
    `  · Total est: $${d.budget.totalEstimatedPerPerson.min.toLocaleString()}–$${d.budget.totalEstimatedPerPerson.max.toLocaleString()}`,
  ];
  return lines.join("\n");
}

function mapShoppingToCards(model: ShoppingResponseModel): ResultCard[] {
  return model.products.map((p: ProductItem) => ({
    id: p.id,
    title: `${p.isBestPick ? "🏆 " : ""}${p.name}`,
    subtitle: `${p.brand} · ${p.shortDescription} · ${p.reviewCount.toLocaleString()} reviews`,
    price: `$${p.price.min}${p.price.max !== p.price.min ? `–$${p.price.max}` : ""}${p.discountPercent ? ` (${p.discountPercent}% off)` : ""}`,
    details: buildShoppingDetail(p),
    imageUrl: p.images[0]?.url,
    meta: {
      categoryId: "shopping" as CategoryId,
      rating: p.rating,
      reviewCount: p.reviewCount,
      specs: p.specs,
      prosAndCons: p.prosAndCons,
      buyLinks: p.buyLinks,
      tags: p.tags,
      isBestPick: p.isBestPick,
      rank: p.rank,
      fullDescription: p.fullDescription,
    },
  }));
}

function buildShoppingDetail(p: ProductItem): string {
  const lines: string[] = [
    p.fullDescription,
    "",
    "📋 Specs:",
    ...p.specs.map((s) => `  · ${s.label}: ${s.value}`),
    "",
    "✅ Pros:",
    ...p.prosAndCons.pros.map((pr) => `  · ${pr}`),
    "",
    "❌ Cons:",
    ...p.prosAndCons.cons.map((c) => `  · ${c}`),
    "",
    "🛒 Where to buy:",
    ...p.buyLinks.map(
      (b) => `  · ${b.platform}: $${b.price ?? p.price.min} — ${b.inStock ? "In Stock" : "Out of Stock"}`
    ),
  ];
  return lines.join("\n");
}

function mapMealsToCards(model: MealResponseModel): ResultCard[] {
  return model.days.map((day: DayPlan) => {
    const mealNames = day.meals.map((m) => m.name).join(" · ");
    const totalCals = day.totalCalories;
    return {
      id: `day-${day.dayNumber}`,
      title: day.dayLabel,
      subtitle: `${mealNames} · ${totalCals} kcal · $${day.totalCost.min}–$${day.totalCost.max}`,
      price: `$${day.totalCost.min}–$${day.totalCost.max}`,
      details: buildMealDetail(day),
      imageUrl: day.meals[0]?.images[0]?.url,
      meta: {
        categoryId: "meals" as CategoryId,
        dayNumber: day.dayNumber,
        dayLabel: day.dayLabel,
        totalCalories: totalCals,
        totalCost: day.totalCost,
        meals: day.meals,
      },
    };
  });
}

function buildMealDetail(day: DayPlan): string {
  const lines: string[] = [`📅 ${day.dayLabel} — ${day.totalCalories} kcal total`, ""];
  for (const meal of day.meals) {
    lines.push(
      `🍽️ ${meal.mealType.toUpperCase()}: ${meal.name}`,
      `   ${meal.caloriesPerServing} kcal · P: ${meal.macros.proteinG}g · C: ${meal.macros.carbsG}g · F: ${meal.macros.fatG}g`,
      `   ⏱ ${meal.totalTimeMinutes} min · Serves ${meal.servings}`,
      `   ${meal.shortDescription}`,
      "",
      "   Ingredients:",
      ...meal.ingredients.map((i) => `     · ${i.quantity} ${i.name}${i.optional ? " (optional)" : ""}`),
      "",
      "   Steps:",
      ...meal.steps.map((s, idx) => `     ${idx + 1}. ${s}`)
    );
    if (meal.tips) lines.push(`   💡 Tip: ${meal.tips}`);
    lines.push("");
  }
  return lines.join("\n");
}

function mapContentToCards(model: ContentResponseModel): ResultCard[] {
  const cards: ResultCard[] = [];
  model.weeks.forEach((week: ContentCalendarWeek) => {
    week.items.forEach((item) => {
      cards.push({
        id: item.id,
        title: item.title,
        subtitle: `${item.platform.toUpperCase()} · ${item.format} · ${item.scheduledDate ?? `Week ${week.weekNumber}`}`,
        price: undefined,
        details: buildContentDetail(item, week.theme),
        imageUrl: undefined,
        meta: {
          categoryId: "content" as CategoryId,
          weekNumber: week.weekNumber,
          weekTheme: week.theme,
          format: item.format,
          platform: item.platform,
          hook: item.hook,
          body: item.body,
          callToAction: item.callToAction,
          hashtags: item.hashtags,
          estimatedReach: item.estimatedReach,
          estimatedEngagementRate: item.estimatedEngagementRate,
          tone: item.tone,
          wordCount: item.wordCount,
          scheduledDate: item.scheduledDate,
          scheduledTime: item.scheduledTime,
        },
      });
    });
  });
  return cards;
}

function buildContentDetail(
  item: ContentResponseModel["weeks"][number]["items"][number],
  weekTheme: string
): string {
  const lines: string[] = [
    `📌 Week theme: ${weekTheme}`,
    `📣 Platform: ${item.platform.toUpperCase()} · Format: ${item.format}`,
    `🕐 Schedule: ${item.scheduledDate ?? "TBD"} at ${item.scheduledTime ?? "9:00 AM"}`,
    "",
    "🎣 Hook:",
    `  "${item.hook}"`,
    "",
    "📝 Full Post:",
    item.body,
    "",
    "📢 CTA:",
    `  ${item.callToAction}`,
  ];
  if (item.hashtags?.length) {
    lines.push("", "🏷️ Hashtags:", `  ${item.hashtags.join(" ")}`);
  }
  if (item.estimatedReach) {
    lines.push(
      "",
      `📊 Est. Reach: ${item.estimatedReach} · Engagement: ${item.estimatedEngagementRate ?? "—"}`
    );
  }
  return lines.join("\n");
}

function mapResearchToCards(model: ResearchResponseModel): ResultCard[] {
  return model.sections.map((section: ResearchSection) => ({
    id: section.id,
    title: section.title,
    subtitle: section.summary.slice(0, 100) + (section.summary.length > 100 ? "…" : ""),
    price: undefined,
    details: buildResearchDetail(section, model),
    imageUrl: undefined,
    meta: {
      categoryId: "research" as CategoryId,
      dataPoints: section.dataPoints,
      insights: section.insights,
      chartData: section.chartData,
      swot: section.id === "swot" ? model.swot : undefined,
      competitors: model.competitors,
    },
  }));
}

function buildResearchDetail(section: ResearchSection, model: ResearchResponseModel): string {
  const lines: string[] = [section.summary, ""];

  if (section.dataPoints.length > 0) {
    lines.push("📊 Key Data Points:");
    section.dataPoints.forEach((dp) => {
      lines.push(
        `  · ${dp.label}: ${dp.value}${dp.source ? ` (${dp.source}${dp.year ? `, ${dp.year}` : ""})` : ""}`
      );
    });
    lines.push("");
  }

  if (section.insights.length > 0) {
    lines.push("💡 Insights:");
    section.insights.forEach((ins) => lines.push(`  · ${ins}`));
    lines.push("");
  }

  // Append SWOT if it exists
  if (model.swot && section.id.toLowerCase().includes("swot")) {
    const { swot } = model;
    lines.push(
      "🔷 SWOT Analysis:",
      "  Strengths:",
      ...swot.strengths.map((s) => `    · ${s}`),
      "  Weaknesses:",
      ...swot.weaknesses.map((s) => `    · ${s}`),
      "  Opportunities:",
      ...swot.opportunities.map((s) => `    · ${s}`),
      "  Threats:",
      ...swot.threats.map((s) => `    · ${s}`),
      ""
    );
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER PARSE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export interface ParseResult {
  model: PaidResponseModel | null;
  cards: ResultCard[];
  intro: string;
  categoryId: CategoryId | null;
  parseError?: string;
}
// Universal fallback: if we can extract useful fields, render them cleanly
// instead of dumping raw JSON
function renderGenericFallback(parsed: Record<string, unknown>): string {
  const lines: string[] = [];

  if (parsed.headline && typeof parsed.headline === "string") {
    lines.push(parsed.headline, "");
  }
  if (parsed.subheadline && typeof parsed.subheadline === "string") {
    lines.push(parsed.subheadline, "");
  }
  if (parsed.executiveSummary && typeof parsed.executiveSummary === "string") {
    lines.push(parsed.executiveSummary, "");
  }

  const findings = parsed.keyFindings as string[] | undefined;
  if (Array.isArray(findings) && findings.length > 0) {
    lines.push("Key Highlights:");
    findings.forEach((f) => lines.push(`· ${f}`));
    lines.push("");
  }

  const recs = parsed.recommendations as string[] | undefined;
  if (Array.isArray(recs) && recs.length > 0) {
    lines.push("Recommendations:");
    recs.forEach((r) => lines.push(`· ${r}`));
  }

  return lines.join("\n") || "Your results are ready.";
}

export function parsePaidResponse(raw: string, hintCategory?: CategoryId): ParseResult {
  const fallback: ParseResult = {
    model: null,
    cards: [],
    // Never use raw JSON as the intro by default
    intro: "Your results are ready.",
    categoryId: hintCategory ?? null,
  };

  // 1. Extract JSON string
  const jsonStr = extractJSON(raw);
  if (!jsonStr) {
    // Raw text (not JSON) — show as-is, it's probably already readable
    return { ...fallback, intro: raw };
  }

  // 2. Parse JSON
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    console.warn("[Parser] JSON.parse failed:", err);
    return { ...fallback, intro: raw, parseError: "Invalid JSON" };
  }

  // Prepare a safe fallback that renders readable text from common fields
  const genericText = renderGenericFallback(parsed);
  const safeFallback: ParseResult = {
    ...fallback,
    intro: genericText,
    categoryId: hintCategory ?? null,
  };

  // 3. Detect category (hint wins)
  const categoryId = hintCategory ?? detectCategory(parsed);
  if (!categoryId) return safeFallback;

  // 4. Cast to correct model and map to cards
  try {
    switch (categoryId) {
      case "vacation": {
        const model = parsed as unknown as VacationResponseModel;
        // Guard: if the model returned wrong schema, return safeFallback with clean message
        if (!Array.isArray(model.destinations) || model.destinations.length === 0) {
          console.warn("[Parser] Vacation schema missing destinations — model returned wrong format");
          return { ...safeFallback, categoryId, parseError: "Wrong schema returned" };
        }
        const cards = mapVacationToCards(model);
        return {
          model,
          cards,
          intro: model.subheadline ?? model.headline ?? "Here are your curated destinations:",
          categoryId,
        };
      }

      case "shopping": {
        const model = parsed as unknown as ShoppingResponseModel;
        if (!Array.isArray(model.products) || model.products.length === 0) {
          console.warn("[Parser] Shopping schema missing products — model returned wrong format");
          return { ...safeFallback, categoryId, parseError: "Wrong schema returned" };
        }
        const cards = mapShoppingToCards(model);
        return {
          model,
          cards,
          intro: model.editorialSummary ?? model.headline ?? "Here are your top picks:",
          categoryId,
        };
      }

      case "meals": {
        const model = parsed as unknown as MealResponseModel;
        if (!Array.isArray(model.days) || model.days.length === 0) {
          console.warn("[Parser] Meals schema missing days — model returned wrong format");
          return { ...safeFallback, categoryId, parseError: "Wrong schema returned" };
        }
        const cards = mapMealsToCards(model);
        const summary = model.summary;
        return {
          model,
          cards,
          intro: summary
            ? `Your ${summary.totalDays}-day ${model.goal} meal plan. Avg ${summary.avgCaloriesPerDay} kcal/day · Est. $${summary.weeklyBudget?.min ?? "—"}–$${summary.weeklyBudget?.max ?? "—"}/week.`
            : "Here's your meal plan:",
          categoryId,
        };
      }

      case "content": {
        const model = parsed as unknown as ContentResponseModel;
        if (!Array.isArray(model.weeks) || model.weeks.length === 0) {
          console.warn("[Parser] Content schema missing weeks — model returned wrong format");
          return { ...safeFallback, categoryId, parseError: "Wrong schema returned" };
        }
        const cards = mapContentToCards(model);
        return {
          model,
          cards,
          intro:
            model.strategyNotes ??
            `Your ${model.totalDays}-day content calendar is ready. Posting ${model.postingSchedule}.`,
          categoryId,
        };
      }

      case "research": {
        const model = parsed as unknown as ResearchResponseModel;

        // If sections empty or missing, render key findings + recommendations as clean text
        if (!Array.isArray(model.sections) || model.sections.length === 0) {
          const lines: string[] = [];
          if (model.headline) lines.push(model.headline, "");
          if (model.executiveSummary) lines.push(model.executiveSummary, "");
          if (Array.isArray((model as any).keyFindings) && (model as any).keyFindings.length) {
            lines.push("Key Highlights:");
            (model as any).keyFindings.forEach((f: string) => lines.push(`· ${f}`));
            lines.push("");
          }
          if (Array.isArray((model as any).recommendations) && (model as any).recommendations.length) {
            lines.push("Recommendations:");
            (model as any).recommendations.forEach((r: string) => lines.push(`· ${r}`));
          }
          return {
            model,
            cards: [],
            intro: lines.join("\n"),
            categoryId,
          };
        }

        const cards = mapResearchToCards(model);
        return {
          model,
          cards,
          intro: model.executiveSummary ?? model.headline ?? "Here is your research report:",
          categoryId,
        };
      }

      default:
        return { ...safeFallback, categoryId, parseError: "Unhandled category" };
    }
  } catch (err) {
    console.error("[Parser] Mapping failed:", err);
    return { ...safeFallback, categoryId, parseError: err instanceof Error ? err.message : "Unknown mapping error" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY SHIM (drop-in for old parseStructuredResponse)
// ─────────────────────────────────────────────────────────────────────────────

export function parseStructuredResponse(
  text: string,
  hintCategory?: CategoryId
): { intro: string; cards: ResultCard[] } {
  const result = parsePaidResponse(text, hintCategory);
  return { intro: result.intro, cards: result.cards };
}
