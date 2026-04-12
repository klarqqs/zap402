import React from "react";

export interface DashboardTabPageHeaderProps {
  /** e.g. `HOME` — accent kicker, same rhythm as Search / Feed */
  kicker: string;
  /** Large display title */
  title: string;
  description: string;
  /** Optional right-side control (e.g. primary button) */
  action?: React.ReactNode;
  /** Terminal tabs use uppercase titles; public pages (e.g. edit profile) can set false. */
  uppercaseTitle?: boolean;
}

const kickerStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "10px",
  color: "var(--color-accent)",
  letterSpacing: "0.15em",
  marginBottom: "4px",
  marginTop: "56px",
};

const descStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "12px",
  color: "var(--color-ink-muted)",
  letterSpacing: "0.06em",
  marginBottom: "40px",
};

/**
 * Terminal tab hero — matches Search / Feed (`max-w-[680px]` parent in TerminalPage).
 */
const DashboardTabPageHeader: React.FC<DashboardTabPageHeaderProps> = ({
  kicker,
  title,
  description,
  action,
  uppercaseTitle = true,
}) => {
  const titleStyle: React.CSSProperties = {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(2rem, 8vw, 2.5rem)",
    color: "var(--color-ink)",
    lineHeight: 1,
    letterSpacing: "-0.02em",
    textTransform: uppercaseTitle ? "uppercase" : "none",
  };

  if (action) {
    return (
      <div style={{ marginBottom: "24px" }}>
        <p style={kickerStyle}>{kicker}</p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            {/* <h1 style={{ ...titleStyle, marginBottom: "8px" }}>{title}</h1> */}
            <p style={descStyle}>{description}</p>
          </div>
          <div className="shrink-0">{action}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "24px" }}>
      <p style={kickerStyle}>{kicker}</p>
      {/* <h1 style={{ ...titleStyle, marginBottom: "8px" }}>{title}</h1> */}
      <p style={descStyle}>{description}</p>
    </div>
  );
};

export default DashboardTabPageHeader;
