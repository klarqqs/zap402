import React, { useState, useRef, KeyboardEvent, ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  /** Optional leading icon (no wrapper styling in tab chrome). */
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  /** Controlled: active tab id (e.g. synced with the URL). */
  activeTab?: string;
  /** Fired when user picks a tab (controlled or uncontrolled). */
  onTabChange?: (id: string) => void;
  /** `editorial` — dashboard / profile (underline active tab, optional icons). */
  variant?: "default" | "editorial";
  /** Appended to the tab strip wrapper (e.g. `md:hidden` when sidebar owns nav on larger screens). */
  tabListWrapperClassName?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  activeTab: activeTabProp,
  onTabChange,
  variant = "default",
  tabListWrapperClassName = "",
}) => {
  const [internalTab, setInternalTab] = useState(
    defaultTab ?? tabs[0]?.id ?? "",
  );
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isControlled = activeTabProp !== undefined;
  const activeTab = isControlled ? activeTabProp : internalTab;

  const selectTab = (id: string) => {
    onTabChange?.(id);
    if (!isControlled) setInternalTab(id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === "ArrowRight") {
      const next = (index + 1) % tabs.length;
      tabRefs.current[next]?.focus();
      selectTab(tabs[next].id);
    } else if (e.key === "ArrowLeft") {
      const prev = (index - 1 + tabs.length) % tabs.length;
      tabRefs.current[prev]?.focus();
      selectTab(tabs[prev].id);
    }
  };

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  const tabListClass =
    variant === "editorial"
      ? "-mb-px flex flex-wrap items-center justify-center gap-3 px-1 pt-1 md:gap-5"
      : "flex border-b-2 border-black";

  const tabButtonClass = (isActive: boolean) => {
    if (variant === "editorial") {
      return [
        "inline-flex items-center gap-2 border-b-2 bg-transparent px-1 pb-2.5 pt-1 font-body text-[13px] font-medium tracking-normal transition-colors",
        isActive
          ? "relative z-[1] border-zap-teal text-zap-ink"
          : "border-transparent text-zap-ink-muted hover:text-zap-ink",
      ].join(" ");
    }
    return [
      "px-4 py-2 text-sm uppercase tracking-wide transition-colors",
      isActive
        ? "font-bold border-b-[3px] border-black -mb-[2px]"
        : "font-normal hover:underline",
    ].join(" ");
  };

  const tabList = (
    <div role="tablist" className={`${tabListClass} max-w-full`}>
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            tabIndex={isActive ? 0 : -1}
            onClick={() => selectTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={tabButtonClass(isActive)}
          >
            {tab.icon ? <span className="shrink-0">{tab.icon}</span> : null}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-w-0 max-w-full">
      {variant === "editorial" ? (
        <div
          className={`border-b border-zap-bg-alt ${tabListWrapperClassName}`.trim()}
        >
          {tabList}
        </div>
      ) : (
        tabList
      )}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="min-w-0 max-w-full"
      >
        {activeContent}
      </div>
    </div>
  );
};

export default Tabs;
