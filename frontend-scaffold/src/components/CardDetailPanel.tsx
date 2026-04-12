// ─────────────────────────────────────────────────────────────────────────────
// CARD DETAIL PANEL
// Rich, category-aware detail panel. Each category gets its own structured layout.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import {
  X,
  Star,
  MapPin,
  Clock,
  Users,
  Zap,
  ShoppingBag,
  Utensils,
  PenLine,
  BarChart2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Flame,
  Leaf,
} from "lucide-react";
import type { ResultCard } from "@/state/chatStore";
import type { CategoryId } from "@/types/PaidResponseModels";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number; max?: number }> = ({ rating, max = 5 }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <Star
        key={i}
        size={11}
        className={i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-zap-border"}
      />
    ))}
    <span className="ml-1 font-mono text-xs text-zap-ink-muted">{rating.toFixed(1)}</span>
  </div>
);

const Badge: React.FC<{
  label: string;
  color?: "brand" | "green" | "amber" | "red" | "blue" | "gray";
}> = ({ label, color = "gray" }) => {
  const colors = {
    brand: "bg-zap-brand/10 text-zap-brand border-zap-bg-alt/20",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    gray: "bg-zap-bg-raised text-zap-ink-muted border-zap-bg-alt",
  };
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 font-body text-[10px] font-semibold ${colors[color]}`}
    >
      {label}
    </span>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-zap-ink-faint mb-2">
    {children}
  </p>
);

const Divider: React.FC = () => <div className="border-t border-zap-bg-alt my-4" />;

const ProConList: React.FC<{ pros: string[]; cons: string[] }> = ({ pros, cons }) => (
  <div className="grid grid-cols-2 gap-3">
    <div>
      <SectionLabel>Pros</SectionLabel>
      <ul className="space-y-1.5">
        {pros.map((p, i) => (
          <li key={i} className="flex items-start gap-1.5 font-body text-xs text-zap-ink">
            <Check size={11} className="shrink-0 mt-0.5 text-emerald-500" />
            {p}
          </li>
        ))}
      </ul>
    </div>
    <div>
      <SectionLabel>Cons</SectionLabel>
      <ul className="space-y-1.5">
        {cons.map((c, i) => (
          <li key={i} className="flex items-start gap-1.5 font-body text-xs text-zap-ink">
            <AlertCircle size={11} className="shrink-0 mt-0.5 text-red-400" />
            {c}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY DETAIL PANELS
// ─────────────────────────────────────────────────────────────────────────────

const VacationDetail: React.FC<{ card: ResultCard }> = ({ card }) => {
  const m = card.meta as any;
  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: <Star size={11} />, label: "Rating", value: m.rating?.toFixed(1) },
          { icon: <MapPin size={11} />, label: "Attractions", value: m.totalAttractions },
          { icon: <Clock size={11} />, label: "Avg stay", value: `${m.averageTimeHours}h` },
          { icon: <Users size={11} />, label: "Visited by", value: m.usedByCount?.toLocaleString() },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-xl bg-zap-bg-raised border border-zap-bg-alt p-2 text-center"
          >
            <div className="flex justify-center text-zap-ink-muted mb-1">{s.icon}</div>
            <p className="font-body text-xs font-semibold text-zap-ink">{s.value}</p>
            <p className="font-body text-[9px] text-zap-ink-faint mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Best time */}
      <div className="rounded-xl bg-zap-brand/5 border border-zap-bg-alt/20 px-3 py-2">
        <p className="font-body text-xs text-zap-ink">
          <span className="font-semibold text-zap-brand">Best time: </span>
          {m.bestTimeToVisit}
        </p>
      </div>

      {/* Description */}
      {m.fullDescription && (
        <>
          <SectionLabel>About</SectionLabel>
          <p className="font-body text-sm text-zap-ink leading-relaxed">{m.fullDescription}</p>
        </>
      )}

      <Divider />

      {/* Pros / Cons */}
      {m.prosAndCons && <ProConList pros={m.prosAndCons.pros} cons={m.prosAndCons.cons} />}

      <Divider />

      {/* Activities */}
      {m.activities?.length > 0 && (
        <>
          <SectionLabel>Activities</SectionLabel>
          <div className="space-y-2">
            {m.activities.map((a: any, i: number) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-body text-xs font-semibold text-zap-ink">{a.name}</p>
                  <p className="font-body text-xs text-zap-ink-muted">{a.description}</p>
                </div>
                {a.estimatedCost && (
                  <span className="shrink-0 font-body text-xs font-semibold text-zap-brand">
                    ${a.estimatedCost.min}–${a.estimatedCost.max}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <Divider />

      {/* Budget */}
      {m.budget && (
        <>
          <SectionLabel>Budget Breakdown (per person)</SectionLabel>
          <div className="space-y-1.5">
            {[
              ["Accommodation", m.budget.accommodationPerNight, "/night"],
              ["Flights", m.budget.flightsPerPerson, ""],
              ["Transport", m.budget.transportPerPerson, ""],
              ["Activities", m.budget.activitiesPerPerson, ""],
              ["Food", m.budget.foodPerPersonPerDay, "/day"],
            ].map(([label, range, suffix]: any, i) => (
              range && (
                <div key={i} className="flex items-center justify-between">
                  <p className="font-body text-xs text-zap-ink-muted">{label}</p>
                  <p className="font-body text-xs font-semibold text-zap-ink">
                    ${range.min.toLocaleString()}–${range.max.toLocaleString()}
                    {suffix}
                  </p>
                </div>
              )
            ))}
            <Divider />
            <div className="flex items-center justify-between">
              <p className="font-body text-sm font-semibold text-zap-ink">
                Total ({m.budget.tripDurationNights} nights)
              </p>
              <p className="font-body text-sm font-semibold text-zap-brand">
                ${m.budget.totalEstimatedPerPerson?.min?.toLocaleString()}–$
                {m.budget.totalEstimatedPerPerson?.max?.toLocaleString()}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Tags */}
      {m.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {m.tags.map((t: string) => (
            <Badge key={t} label={t} />
          ))}
        </div>
      )}
    </div>
  );
};

const ShoppingDetail: React.FC<{ card: ResultCard }> = ({ card }) => {
  const m = card.meta as any;
  return (
    <div className="space-y-4">
      {/* Rating + rank */}
      <div className="flex items-center justify-between">
        <StarRating rating={m.rating ?? 0} />
        <p className="font-body text-xs text-zap-ink-muted">{m.reviewCount?.toLocaleString()} reviews</p>
      </div>

      {m.isBestPick && <Badge label="🏆 Best Pick" color="brand" />}

      {/* Full description */}
      {m.fullDescription && (
        <p className="font-body text-sm text-zap-ink leading-relaxed">{m.fullDescription}</p>
      )}

      <Divider />

      {/* Specs */}
      {m.specs?.length > 0 && (
        <>
          <SectionLabel>Specifications</SectionLabel>
          <div className="rounded-xl border border-zap-bg-alt overflow-hidden">
            {m.specs.map((s: any, i: number) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2 font-body text-xs ${
                  i % 2 === 0 ? "bg-zap-bg-raised" : "bg-zap-bg"
                }`}
              >
                <span className="text-zap-ink-muted">{s.label}</span>
                <span className="font-semibold text-zap-ink">{s.value}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <Divider />

      {/* Pros / cons */}
      {m.prosAndCons && <ProConList pros={m.prosAndCons.pros} cons={m.prosAndCons.cons} />}

      <Divider />

      {/* Buy links */}
      {m.buyLinks?.length > 0 && (
        <>
          <SectionLabel>Where to Buy</SectionLabel>
          <div className="space-y-2">
            {m.buyLinks.map((b: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-zap-bg-alt px-3 py-2"
              >
                <div>
                  <p className="font-body text-xs font-semibold text-zap-ink">{b.platform}</p>
                  <Badge
                    label={b.inStock ? "In Stock" : "Out of Stock"}
                    color={b.inStock ? "green" : "red"}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {b.price && (
                    <p className="font-body text-sm font-semibold text-zap-brand">${b.price}</p>
                  )}
                  {b.url && b.url !== "#" && (
                    <button
                      onClick={() => window.open(b.url, "_blank")}
                      className="rounded-lg border border-zap-bg-alt/30 bg-zap-brand/5 p-1.5 text-zap-brand hover:bg-zap-brand/10 transition-colors"
                    >
                      <ExternalLink size={11} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {m.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {m.tags.map((t: string) => (
            <Badge key={t} label={t} />
          ))}
        </div>
      )}
    </div>
  );
};

const MealsDetail: React.FC<{ card: ResultCard }> = ({ card }) => {
  const m = card.meta as any;
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Day stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-zap-bg-raised border border-zap-bg-alt p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame size={12} className="text-orange-400" />
            <p className="font-body text-[10px] text-zap-ink-faint uppercase tracking-wide">
              Total Calories
            </p>
          </div>
          <p className="font-body text-xl font-semibold text-zap-ink">
            {m.totalCalories?.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-zap-bg-raised border border-zap-bg-alt p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Leaf size={12} className="text-emerald-500" />
            <p className="font-body text-[10px] text-zap-ink-faint uppercase tracking-wide">
              Day Cost
            </p>
          </div>
          <p className="font-body text-xl font-semibold text-zap-ink">
            ${m.totalCost?.min}–${m.totalCost?.max}
          </p>
        </div>
      </div>

      {/* Meals */}
      {m.meals?.map((meal: any) => {
        const isExpanded = expandedMeal === meal.id;
        return (
          <div key={meal.id} className="rounded-xl border border-zap-bg-alt overflow-hidden">
            <button
              onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-zap-bg-raised transition-colors"
            >
              <div className="flex items-start gap-2 text-left">
                <Badge
                  label={meal.mealType}
                  color={
                    meal.mealType === "breakfast"
                      ? "amber"
                      : meal.mealType === "lunch"
                      ? "blue"
                      : "green"
                  }
                />
                <div>
                  <p className="font-body text-sm font-semibold text-zap-ink">{meal.name}</p>
                  <p className="font-body text-xs text-zap-ink-muted">
                    {meal.caloriesPerServing} kcal · P {meal.macros?.proteinG}g · C{" "}
                    {meal.macros?.carbsG}g · F {meal.macros?.fatG}g · ⏱ {meal.totalTimeMinutes}m
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp size={13} className="shrink-0 text-zap-ink-muted" />
              ) : (
                <ChevronDown size={13} className="shrink-0 text-zap-ink-muted" />
              )}
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-3 border-t border-zap-bg-alt">
                <p className="font-body text-xs text-zap-ink-muted pt-2">{meal.shortDescription}</p>

                {meal.ingredients?.length > 0 && (
                  <>
                    <SectionLabel>Ingredients</SectionLabel>
                    <ul className="space-y-1">
                      {meal.ingredients.map((ing: any, i: number) => (
                        <li key={i} className="flex items-center gap-2 font-body text-xs text-zap-ink">
                          <span className="h-1 w-1 rounded-full bg-zap-brand shrink-0" />
                          <span className="font-semibold">{ing.quantity}</span> {ing.name}
                          {ing.optional && <span className="text-zap-ink-faint">(optional)</span>}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {meal.steps?.length > 0 && (
                  <>
                    <SectionLabel>Steps</SectionLabel>
                    <ol className="space-y-1.5">
                      {meal.steps.map((step: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 font-body text-xs text-zap-ink">
                          <span className="shrink-0 rounded-full bg-zap-brand/10 text-zap-brand w-4 h-4 flex items-center justify-center text-[9px] font-bold mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </>
                )}

                {meal.tips && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-2">
                    <p className="font-body text-xs text-amber-700">💡 {meal.tips}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ContentDetail: React.FC<{ card: ResultCard }> = ({ card }) => {
  const m = card.meta as any;
  return (
    <div className="space-y-4">
      {/* Meta row */}
      <div className="flex flex-wrap gap-1.5">
        <Badge label={m.platform?.toUpperCase() ?? "—"} color="blue" />
        <Badge label={m.format ?? "—"} color="brand" />
        {m.scheduledDate && <Badge label={m.scheduledDate} color="gray" />}
        {m.scheduledTime && <Badge label={m.scheduledTime} color="gray" />}
      </div>

      {m.weekTheme && (
        <div className="rounded-lg bg-zap-brand/5 border border-zap-bg-alt/20 px-3 py-2">
          <p className="font-body text-xs text-zap-ink-muted">Week theme</p>
          <p className="font-body text-sm font-semibold text-zap-ink">{m.weekTheme}</p>
        </div>
      )}

      {/* Hook */}
      {m.hook && (
        <>
          <SectionLabel>Opening Hook</SectionLabel>
          <blockquote className="border-l-2 border-zap-bg-alt pl-3 font-body text-sm italic text-zap-ink leading-relaxed">
            "{m.hook}"
          </blockquote>
        </>
      )}

      <Divider />

      {/* Full body */}
      {m.body && (
        <>
          <SectionLabel>Full Post</SectionLabel>
          <p className="font-body text-sm text-zap-ink leading-relaxed whitespace-pre-wrap">
            {m.body}
          </p>
        </>
      )}

      <Divider />

      {/* CTA */}
      {m.callToAction && (
        <>
          <SectionLabel>Call to Action</SectionLabel>
          <div className="rounded-xl bg-zap-brand/5 border border-zap-bg-alt/20 px-3 py-2">
            <p className="font-body text-sm font-semibold text-zap-ink">{m.callToAction}</p>
          </div>
        </>
      )}

      {/* Hashtags */}
      {m.hashtags?.length > 0 && (
        <>
          <SectionLabel>Hashtags</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {m.hashtags.map((h: string) => (
              <span
                key={h}
                className="font-body text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5"
              >
                {h}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Performance estimates */}
      {m.estimatedReach && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-zap-bg-raised border border-zap-bg-alt p-2 text-center">
            <p className="font-body text-xs font-semibold text-zap-ink">{m.estimatedReach}</p>
            <p className="font-body text-[9px] text-zap-ink-faint mt-0.5">Est. Reach</p>
          </div>
          <div className="rounded-xl bg-zap-bg-raised border border-zap-bg-alt p-2 text-center">
            <p className="font-body text-xs font-semibold text-zap-ink">
              {m.estimatedEngagementRate ?? "—"}
            </p>
            <p className="font-body text-[9px] text-zap-ink-faint mt-0.5">Engagement Rate</p>
          </div>
        </div>
      )}
    </div>
  );
};

const ResearchDetail: React.FC<{ card: ResultCard }> = ({ card }) => {
  const m = card.meta as any;
  return (
    <div className="space-y-4">
      {/* Data points */}
      {m.dataPoints?.length > 0 && (
        <>
          <SectionLabel>Key Data Points</SectionLabel>
          <div className="space-y-2">
            {m.dataPoints.map((dp: any, i: number) => (
              <div
                key={i}
                className="rounded-xl bg-zap-bg-raised border border-zap-bg-alt px-3 py-2.5 flex items-start justify-between gap-2"
              >
                <div>
                  <p className="font-body text-xs text-zap-ink-muted">{dp.label}</p>
                  {dp.source && (
                    <p className="font-body text-[9px] text-zap-ink-faint mt-0.5">
                      {dp.source}
                      {dp.year ? `, ${dp.year}` : ""}
                    </p>
                  )}
                </div>
                <p className="font-body text-base font-semibold text-zap-brand shrink-0">{dp.value}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Insights */}
      {m.insights?.length > 0 && (
        <>
          <SectionLabel>Insights</SectionLabel>
          <ul className="space-y-2">
            {m.insights.map((ins: string, i: number) => (
              <li key={i} className="flex items-start gap-2 font-body text-sm text-zap-ink">
                <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-zap-brand" />
                {ins}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* SWOT */}
      {m.swot && (
        <>
          <Divider />
          <SectionLabel>SWOT Analysis</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: "Strengths",
                items: m.swot.strengths,
                color: "bg-emerald-50 border-emerald-200 text-emerald-700",
              },
              {
                label: "Weaknesses",
                items: m.swot.weaknesses,
                color: "bg-red-50 border-red-200 text-red-700",
              },
              {
                label: "Opportunities",
                items: m.swot.opportunities,
                color: "bg-blue-50 border-blue-200 text-blue-700",
              },
              {
                label: "Threats",
                items: m.swot.threats,
                color: "bg-amber-50 border-amber-200 text-amber-700",
              },
            ].map((q) => (
              <div key={q.label} className={`rounded-xl border p-2.5 ${q.color}`}>
                <p className="font-body text-[9px] font-bold uppercase tracking-widest mb-1.5">
                  {q.label}
                </p>
                <ul className="space-y-1">
                  {q.items?.map((item: string, i: number) => (
                    <li key={i} className="font-body text-[10px] leading-snug">
                      · {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Competitors */}
      {m.competitors?.length > 0 && (
        <>
          <Divider />
          <SectionLabel>Competitors</SectionLabel>
          <div className="space-y-2">
            {m.competitors.map((c: any, i: number) => (
              <div key={i} className="rounded-xl border border-zap-bg-alt p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-body text-sm font-semibold text-zap-ink">{c.name}</p>
                  {c.marketShare && <Badge label={c.marketShare} color="brand" />}
                </div>
                {c.notableFeature && (
                  <p className="font-body text-xs text-zap-ink-muted">{c.notableFeature}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-emerald-600 font-semibold mb-1">Strengths</p>
                    {c.strengths?.slice(0, 2).map((s: string, j: number) => (
                      <p key={j} className="text-zap-ink-muted">
                        · {s}
                      </p>
                    ))}
                  </div>
                  <div>
                    <p className="text-red-500 font-semibold mb-1">Weaknesses</p>
                    {c.weaknesses?.slice(0, 2).map((s: string, j: number) => (
                      <p key={j} className="text-zap-ink-muted">
                        · {s}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY ICON MAP
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<
  CategoryId,
  React.FC<{ size: number; className?: string }>
> = {
  vacation: (p) => <MapPin {...p} />,
  shopping: (p) => <ShoppingBag {...p} />,
  meals: (p) => <Utensils {...p} />,
  content: (p) => <PenLine {...p} />,
  research: (p) => <BarChart2 {...p} />,
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────────────────────────────────

export const CardDetailPanel: React.FC<{
  card: ResultCard | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ card, isOpen, onClose }) => {
  if (!card || !isOpen) return null;

  const categoryId = card.meta?.categoryId as CategoryId | undefined;
  const CategoryIcon = categoryId ? CATEGORY_ICONS[categoryId] : null;

  const renderBody = () => {
    switch (categoryId) {
      case "vacation":
        return <VacationDetail card={card} />;
      case "shopping":
        return <ShoppingDetail card={card} />;
      case "meals":
        return <MealsDetail card={card} />;
      case "content":
        return <ContentDetail card={card} />;
      case "research":
        return <ResearchDetail card={card} />;
      default:
        // Generic fallback — render raw details text
        return card.details ? (
          <p className="font-body text-sm text-zap-ink leading-relaxed whitespace-pre-wrap">
            {card.details}
          </p>
        ) : null;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-zap-bg border-l border-zap-bg-alt shadow-xl overflow-hidden z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-zap-bg-alt shrink-0">
        <div className="flex items-start gap-2.5 min-w-0">
          {CategoryIcon && (
            <div className="shrink-0 mt-0.5 h-6 w-6 rounded-lg bg-zap-brand/10 flex items-center justify-center">
              <CategoryIcon size={12} className="text-zap-brand" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-body font-semibold text-zap-ink text-sm leading-snug line-clamp-2">
              {card.title}
            </h3>
            {card.subtitle && (
              <p className="font-body text-xs text-zap-ink-muted mt-0.5 line-clamp-1">
                {card.subtitle}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-zap-ink-muted hover:bg-zap-bg-raised transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Hero image */}
      {card.imageUrl && (
        <div className="shrink-0 h-44 overflow-hidden bg-zap-bg-alt">
          <img
            src={card.imageUrl}
            alt={card.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* Price badge */}
      {card.price && (
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-zap-bg-raised border-b border-zap-bg-alt">
          <p className="font-body text-xs text-zap-ink-muted uppercase tracking-wide">Price</p>
          <p className="font-body text-sm font-bold text-zap-brand">{card.price}</p>
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4">{renderBody()}</div>
    </div>
  );
};
