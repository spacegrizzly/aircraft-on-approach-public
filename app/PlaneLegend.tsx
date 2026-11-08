"use client";

import React, { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

interface PlaneLegendProps {
  style?: React.CSSProperties;
}

export default function PlaneLegend({ style }: PlaneLegendProps) {
  const [collapsed, setCollapsed] = useState(false);

  const legendItems = [
    {
      label: "Enroute Cruise (≥ 10k ft)",
      desc: "White body & white contour, cruising at FL100+",
      color: "#ffffff",
      stroke: "#ffffff",
      bgBadge: "#0f172a",
      textColor: "#f8fafc",
    },
    {
      label: "Airborne Low (< 10k ft)",
      desc: "Green marker, maneuvering in terminal airspace",
      color: "#16a34a",
      stroke: "#15803d",
      bgBadge: "rgba(22, 163, 74, 0.2)",
      textColor: "#86efac",
    },
    {
      label: "Ground (Taxiing)",
      desc: "Amber marker, active surface movement (> 0 kts)",
      color: "#ca8a04",
      stroke: "#854d0e",
      bgBadge: "rgba(202, 138, 4, 0.2)",
      textColor: "#fef08a",
    },
    {
      label: "Parked / Stationary",
      desc: "Slate grey marker, parked at apron / gate (0 kts)",
      color: "#64748b",
      stroke: "#334155",
      bgBadge: "rgba(100, 116, 139, 0.2)",
      textColor: "#cbd5e1",
    },
    {
      label: "Active Runway Approach",
      desc: "Sky blue vector, established on ILS / Final vector",
      color: "#38bdf8",
      stroke: "#0284c7",
      bgBadge: "rgba(56, 189, 248, 0.2)",
      textColor: "#7dd3fc",
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "rgba(10, 15, 29, 0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(148, 163, 184, 0.3)",
        borderRadius: "10px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 15px 1px rgba(148, 163, 184, 0.1)",
        color: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
        width: "300px",
        maxWidth: "90vw",
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "auto",
        ...style,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderBottom: collapsed ? "none" : "1px solid rgba(51, 65, 85, 0.6)",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Info size={14} color="#38bdf8" />
          <span
            style={{
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "0.8px",
              color: "#e2e8f0",
              textTransform: "uppercase",
            }}
          >
            Aircraft Color Legend
          </span>
        </div>

        <button
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            padding: "2px",
            display: "flex",
            alignItems: "center",
          }}
          aria-label={collapsed ? "Expand legend" : "Collapse legend"}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* Legend list */}
      {!collapsed && (
        <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {legendItems.map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 6px",
                borderRadius: "6px",
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(51, 65, 85, 0.4)",
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  minWidth: "18px",
                  borderRadius: "4px",
                  backgroundColor: item.color,
                  border: `2px solid ${item.stroke}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: item.color === "#ffffff" ? "0 0 4px rgba(255,255,255,0.8)" : "none",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill={item.color === "#ffffff" ? "#0f172a" : "#ffffff"}>
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1-1-1s-1 .17-1 1V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z"/>
                </svg>
              </div>

              <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "10.5px", fontWeight: "700", color: item.textColor }}>
                  {item.label}
                </div>
                <div style={{ fontSize: "9px", color: "#94a3b8", lineHeight: "1.2" }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
