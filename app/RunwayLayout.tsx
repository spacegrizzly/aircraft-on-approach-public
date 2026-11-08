"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface RunwayLayoutProps {
  style?: React.CSSProperties;
}

export default function RunwayLayout({ style }: RunwayLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        backgroundColor: "rgba(10, 15, 29, 0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(249, 115, 22, 0.4)",
        borderRadius: "10px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 15px 1px rgba(249, 115, 22, 0.15)",
        color: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
        width: "380px",
        maxWidth: "92vw",
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderBottom: collapsed ? "none" : "1px solid rgba(51, 65, 85, 0.6)",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              boxShadow: "0 0 8px #22c55e",
            }}
          />
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "800",
                letterSpacing: "1px",
                color: "#f97316",
                textTransform: "uppercase",
              }}
            >
              LOWW / VIE Runway Layout
            </div>
            <div style={{ fontSize: "10px", color: "#94a3b8" }}>
              Vienna Schwechat • Elev 600 ft • 2 Runways
            </div>
          </div>
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
          aria-label={collapsed ? "Expand runway diagram" : "Collapse runway diagram"}
        >
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {/* Diagram Body */}
      {!collapsed && (
        <div style={{ padding: "12px 14px 12px 14px" }}>
          {/* SVG Runway Schematic */}
          <div
            style={{
              position: "relative",
              backgroundColor: "#070b16",
              borderRadius: "8px",
              border: "1px solid #1e293b",
              padding: "6px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <svg
              viewBox="0 0 350 300"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "260px",
                overflow: "visible",
              }}
            >
              <defs>
                {/* Arrow markers for approach paths */}
                <marker
                  id="arrow-app-11"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <path d="M1,1 L7,4 L1,7 L3,4 Z" fill="#38bdf8" />
                </marker>
                <marker
                  id="arrow-app-29"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <path d="M1,1 L7,4 L1,7 L3,4 Z" fill="#38bdf8" />
                </marker>
                <marker
                  id="arrow-app-16"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <path d="M1,1 L7,4 L1,7 L3,4 Z" fill="#38bdf8" />
                </marker>
                <marker
                  id="arrow-app-34"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <path d="M1,1 L7,4 L1,7 L3,4 Z" fill="#38bdf8" />
                </marker>

                {/* Subtle radar circular gradient */}
                <radialGradient id="radar-bg-lg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#030712" stopOpacity="0.95" />
                </radialGradient>
              </defs>

              {/* Background radar circles */}
              <rect width="350" height="300" fill="url(#radar-bg-lg)" rx="6" />
              <circle cx="175" cy="150" r="60" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="175" cy="150" r="110" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

              {/* Compass North Indicator */}
              <g transform="translate(310, 30)">
                <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                <path d="M0,-11 L3.5,3 L0,0 L-3.5,3 Z" fill="#ef4444" />
                <path d="M0,11 L3.5,-3 L0,0 L-3.5,-3 Z" fill="#64748b" />
                <text x="0" y="-13" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="900" fontFamily="system-ui">N</text>
              </g>

              {/* ────────────────────────────────────────────────────────── */}
              {/* RUNWAY 11/29 EXTENDED APPROACH PATHS                       */}
              {/* ────────────────────────────────────────────────────────── */}

              {/* Approach to 11 (from WNW 114° heading) */}
              <line
                x1="32"
                y1="68"
                x2="84"
                y2="92"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                markerEnd="url(#arrow-app-11)"
              />
              {/* Approach 11 Label Badge */}
              <g transform="translate(32, 60)">
                <rect x="-26" y="-11" width="52" height="20" rx="4" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800" fontFamily="system-ui">
                  APP 11
                </text>
                <text x="0" y="17" textAnchor="middle" fill="#7dd3fc" fontSize="7.5" fontWeight="700" fontFamily="system-ui">
                  114°
                </text>
              </g>

              {/* Approach to 29 (from ESE 294° heading) */}
              <line
                x1="298"
                y1="188"
                x2="246"
                y2="164"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                markerEnd="url(#arrow-app-29)"
              />
              {/* Approach 29 Label Badge */}
              <g transform="translate(298, 196)">
                <rect x="-26" y="-11" width="52" height="20" rx="4" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800" fontFamily="system-ui">
                  APP 29
                </text>
                <text x="0" y="17" textAnchor="middle" fill="#7dd3fc" fontSize="7.5" fontWeight="700" fontFamily="system-ui">
                  294°
                </text>
              </g>

              {/* ────────────────────────────────────────────────────────── */}
              {/* RUNWAY 16/34 EXTENDED APPROACH PATHS                       */}
              {/* ────────────────────────────────────────────────────────── */}

              {/* Approach to 16 (from NNW 163° heading) */}
              <line
                x1="110"
                y1="28"
                x2="124"
                y2="70"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                markerEnd="url(#arrow-app-16)"
              />
              {/* Approach 16 Label Badge */}
              <g transform="translate(108, 18)">
                <rect x="-26" y="-11" width="52" height="20" rx="4" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800" fontFamily="system-ui">
                  APP 16
                </text>
                <text x="0" y="17" textAnchor="middle" fill="#7dd3fc" fontSize="7.5" fontWeight="700" fontFamily="system-ui">
                  163°
                </text>
              </g>

              {/* Approach to 34 (from SSE 343° heading) */}
              <line
                x1="188"
                y1="272"
                x2="174"
                y2="230"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                markerEnd="url(#arrow-app-34)"
              />
              {/* Approach 34 Label Badge */}
              <g transform="translate(190, 280)">
                <rect x="-26" y="-11" width="52" height="20" rx="4" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="800" fontFamily="system-ui">
                  APP 34
                </text>
                <text x="0" y="17" textAnchor="middle" fill="#7dd3fc" fontSize="7.5" fontWeight="700" fontFamily="system-ui">
                  343°
                </text>
              </g>

              {/* ────────────────────────────────────────────────────────── */}
              {/* PHYSICAL RUNWAY ASPHALT STRIPS                             */}
              {/* ────────────────────────────────────────────────────────── */}

              {/* RWY 11/29 Asphalt Strip */}
              <line
                x1="86"
                y1="94"
                x2="242"
                y2="162"
                stroke="#1e293b"
                strokeWidth="16"
                strokeLinecap="butt"
              />
              <line
                x1="86"
                y1="94"
                x2="242"
                y2="162"
                stroke="#334155"
                strokeWidth="13"
                strokeLinecap="butt"
              />
              {/* RWY 11/29 White Centerline */}
              <line
                x1="92"
                y1="97"
                x2="236"
                y2="159"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeDasharray="6 4"
              />

              {/* RWY 16/34 Asphalt Strip */}
              <line
                x1="126"
                y1="76"
                x2="172"
                y2="224"
                stroke="#1e293b"
                strokeWidth="16"
                strokeLinecap="butt"
              />
              <line
                x1="126"
                y1="76"
                x2="172"
                y2="224"
                stroke="#334155"
                strokeWidth="13"
                strokeLinecap="butt"
              />
              {/* RWY 16/34 White Centerline */}
              <line
                x1="128"
                y1="84"
                x2="170"
                y2="216"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeDasharray="6 4"
              />

              {/* ────────────────────────────────────────────────────────── */}
              {/* RUNWAY THRESHOLD IDENTIFIERS (11, 29, 16, 34)              */}
              {/* ────────────────────────────────────────────────────────── */}

              {/* RWY 11 Threshold Marker */}
              <g transform="translate(98, 83)">
                <rect x="-9" y="-7" width="18" height="14" rx="2" fill="#0f172a" stroke="#f97316" strokeWidth="1.2" />
                <text x="0" y="3.5" textAnchor="middle" fill="#f97316" fontSize="10" fontWeight="900" fontFamily="monospace">
                  11
                </text>
              </g>

              {/* RWY 29 Threshold Marker */}
              <g transform="translate(230, 173)">
                <rect x="-9" y="-7" width="18" height="14" rx="2" fill="#0f172a" stroke="#f97316" strokeWidth="1.2" />
                <text x="0" y="3.5" textAnchor="middle" fill="#f97316" fontSize="10" fontWeight="900" fontFamily="monospace">
                  29
                </text>
              </g>

              {/* RWY 16 Threshold Marker */}
              <g transform="translate(140, 81)">
                <rect x="-9" y="-7" width="18" height="14" rx="2" fill="#0f172a" stroke="#f97316" strokeWidth="1.2" />
                <text x="0" y="3.5" textAnchor="middle" fill="#f97316" fontSize="10" fontWeight="900" fontFamily="monospace">
                  16
                </text>
              </g>

              {/* RWY 34 Threshold Marker */}
              <g transform="translate(158, 218)">
                <rect x="-9" y="-7" width="18" height="14" rx="2" fill="#0f172a" stroke="#f97316" strokeWidth="1.2" />
                <text x="0" y="3.5" textAnchor="middle" fill="#f97316" fontSize="10" fontWeight="900" fontFamily="monospace">
                  34
                </text>
              </g>
            </svg>
          </div>

          {/* Runway Technical Details Footer */}
          <div
            style={{
              marginTop: "8px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px",
              fontSize: "10.5px",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(30, 41, 59, 0.7)",
                borderRadius: "5px",
                padding: "5px 8px",
                border: "1px solid rgba(51, 65, 85, 0.5)",
              }}
            >
              <div style={{ color: "#f97316", fontWeight: "800" }}>RWY 11 / 29</div>
              <div style={{ color: "#cbd5e1" }}>3,500 m • 11,483 ft</div>
              <div style={{ color: "#94a3b8" }}>Hdg: 114° / 294°</div>
            </div>

            <div
              style={{
                backgroundColor: "rgba(30, 41, 59, 0.7)",
                borderRadius: "5px",
                padding: "5px 8px",
                border: "1px solid rgba(51, 65, 85, 0.5)",
              }}
            >
              <div style={{ color: "#f97316", fontWeight: "800" }}>RWY 16 / 34</div>
              <div style={{ color: "#cbd5e1" }}>3,600 m • 11,811 ft</div>
              <div style={{ color: "#94a3b8" }}>Hdg: 163° / 343°</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
