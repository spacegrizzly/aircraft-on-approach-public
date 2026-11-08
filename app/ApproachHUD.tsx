"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Radio, Compass, Plane, Navigation, CheckCircle2, ExternalLink } from "lucide-react";
import { FlightState } from "./types";
import { RUNWAYS, detectAllApproaches, ApproachFlight } from "./approachDetection";

interface ApproachHUDProps {
  flights: FlightState[];
}

export default function ApproachHUD({ flights }: ApproachHUDProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedRunway, setSelectedRunway] = useState<string>("ALL");

  // Detect and group approaching aircraft across all runways
  const approaches = useMemo(() => {
    return detectAllApproaches(flights);
  }, [flights]);

  // Calculate total approaching flights
  const totalApproachingCount = useMemo(() => {
    return Object.values(approaches).reduce((sum, list) => sum + list.length, 0);
  }, [approaches]);

  // Filter flights based on selected runway toggle
  const displayedFlights: ApproachFlight[] = useMemo(() => {
    if (selectedRunway === "ALL") {
      const all: ApproachFlight[] = [];
      for (const rwyId of ["11", "29", "16", "34"]) {
        all.push(...(approaches[rwyId] || []));
      }
      return all.sort((a, b) => a.alongTrackNM - b.alongTrackNM);
    }
    return approaches[selectedRunway] || [];
  }, [approaches, selectedRunway]);

  return (
    <div
      style={{
        backgroundColor: "rgba(10, 15, 29, 0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(56, 189, 248, 0.4)",
        borderRadius: "10px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 15px 1px rgba(56, 189, 248, 0.15)",
        color: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
        width: "380px",
        maxWidth: "92vw",
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HUD Header Bar */}
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
              position: "relative",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: totalApproachingCount > 0 ? "#38bdf8" : "#94a3b8",
              boxShadow: totalApproachingCount > 0 ? "0 0 8px #38bdf8" : "none",
            }}
          />
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "800",
                letterSpacing: "1px",
                color: "#38bdf8",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              Approach Radar HUD
              <span
                style={{
                  fontSize: "10px",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  backgroundColor: totalApproachingCount > 0 ? "rgba(56, 189, 248, 0.2)" : "rgba(100, 116, 139, 0.2)",
                  color: totalApproachingCount > 0 ? "#7dd3fc" : "#94a3b8",
                  border: `1px solid ${totalApproachingCount > 0 ? "rgba(56, 189, 248, 0.4)" : "rgba(100, 116, 139, 0.3)"}`,
                }}
              >
                {totalApproachingCount} Active
              </span>
            </div>
            <div style={{ fontSize: "10px", color: "#94a3b8" }}>
              LOWW / VIE Inbound Final Vectors
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
          aria-label={collapsed ? "Expand approach radar" : "Collapse approach radar"}
        >
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {/* Expanded Content Body */}
      {!collapsed && (
        <div style={{ padding: "10px 12px 12px 12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Approach Toggles Bar */}
          <div>
            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "5px" }}>
              Select Approach Corridor:
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 1fr 1fr 1fr 1fr",
                gap: "4px",
              }}
            >
              {/* ALL toggle */}
              <button
                onClick={() => setSelectedRunway("ALL")}
                style={{
                  backgroundColor: selectedRunway === "ALL" ? "#0284c7" : "rgba(30, 41, 59, 0.8)",
                  border: selectedRunway === "ALL" ? "1px solid #38bdf8" : "1px solid rgba(51, 65, 85, 0.5)",
                  color: selectedRunway === "ALL" ? "#ffffff" : "#94a3b8",
                  padding: "5px 2px",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  boxShadow: selectedRunway === "ALL" ? "0 0 10px rgba(56, 189, 248, 0.3)" : "none",
                }}
              >
                <span>ALL</span>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: "700",
                    opacity: 0.9,
                    color: selectedRunway === "ALL" ? "#bae6fd" : "#64748b",
                  }}
                >
                  ({totalApproachingCount})
                </span>
              </button>

              {/* Individual runway toggles */}
              {(["11", "29", "16", "34"] as const).map((rwyId) => {
                const count = approaches[rwyId]?.length || 0;
                const isSelected = selectedRunway === rwyId;
                const rwy = RUNWAYS[rwyId];

                return (
                  <button
                    key={rwyId}
                    onClick={() => setSelectedRunway(rwyId)}
                    style={{
                      backgroundColor: isSelected ? "#0284c7" : "rgba(30, 41, 59, 0.8)",
                      border: isSelected ? "1px solid #38bdf8" : "1px solid rgba(51, 65, 85, 0.5)",
                      color: isSelected ? "#ffffff" : "#cbd5e1",
                      padding: "5px 2px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                      boxShadow: isSelected ? "0 0 10px rgba(56, 189, 248, 0.3)" : "none",
                    }}
                  >
                    <span>{rwyId}</span>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: "700",
                        color: count > 0 ? (isSelected ? "#fef08a" : "#38bdf8") : "#64748b",
                      }}
                    >
                      {count > 0 ? `${count} ✈` : `${rwy.heading}°`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Runway Corridor Banner (if specific runway chosen) */}
          {selectedRunway !== "ALL" && (
            <div
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: "6px",
                padding: "6px 10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "10px",
              }}
            >
              <div>
                <span style={{ color: "#38bdf8", fontWeight: "800" }}>
                  Approach {selectedRunway}
                </span>{" "}
                <span style={{ color: "#94a3b8" }}>
                  • Inbound Ingress {RUNWAYS[selectedRunway].heading}°
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {selectedRunway === "11" && (
                  <Link
                    href="/rwy11"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "#38bdf8",
                      textDecoration: "none",
                      backgroundColor: "rgba(2, 132, 199, 0.25)",
                      border: "1px solid rgba(56, 189, 248, 0.5)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontWeight: "700",
                      fontSize: "9.5px",
                    }}
                  >
                    Dedicated RWY11 View <ExternalLink size={10} />
                  </Link>
                )}
                <div style={{ color: "#64748b", fontFamily: "monospace" }}>
                  GS 3.0° • ILS
                </div>
              </div>
            </div>
          )}

          {/* Aircraft List Container */}
          <div
            style={{
              maxHeight: "260px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "7px",
              paddingRight: "2px",
            }}
          >
            {displayedFlights.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  backgroundColor: "rgba(15, 23, 42, 0.6)",
                  borderRadius: "8px",
                  border: "1px dashed rgba(51, 65, 85, 0.8)",
                }}
              >
                <Radio style={{ width: "22px", height: "22px", color: "#64748b", margin: "0 auto 6px auto", display: "block" }} />
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8" }}>
                  No aircraft on {selectedRunway === "ALL" ? "any final approach" : `RWY ${selectedRunway} approach`}
                </div>
                <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                  Vector matching active on speed & heading
                </div>
              </div>
            ) : (
              displayedFlights.map((item) => {
                let phaseBg = "#854d0e";
                let phaseColor = "#fef08a";

                if (item.approachPhase === "Short Final") {
                  phaseBg = "#15803d";
                  phaseColor = "#86efac";
                } else if (item.approachPhase === "Final") {
                  phaseBg = "#166534";
                  phaseColor = "#bbf7d0";
                } else if (item.approachPhase === "Established") {
                  phaseBg = "#075985";
                  phaseColor = "#bae6fd";
                }

                const originDisplay = item.flight.origin_iata || item.flight.origin_icao || (item.flight.origin_city ? item.flight.origin_city : null);
                const destDisplay = item.flight.destination_iata || item.flight.destination_icao || (item.flight.destination_city ? item.flight.destination_city : "VIE");
                const originPlace = item.flight.origin_city || item.flight.origin_name;
                const destinationPlace = item.flight.destination_city || item.flight.destination_name;

                return (
                  <div
                    key={`${item.flight.icao24}-${item.runway.id}`}
                    style={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid rgba(51, 65, 85, 0.9)",
                      borderRadius: "7px",
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    {/* Top Row: Callsign, Type & Approach Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "900", color: "#ffffff", letterSpacing: "0.5px" }}>
                          ✈ {item.flight.callsign}
                        </span>
                        {item.flight.aircraft_type && (
                          <span
                            style={{
                              fontSize: "10px",
                              color: "#38bdf8",
                              fontWeight: "700",
                              backgroundColor: "rgba(56, 189, 248, 0.15)",
                              padding: "1px 5px",
                              borderRadius: "4px",
                            }}
                          >
                            {item.flight.aircraft_type}
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "4px" }}>
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: "800",
                            backgroundColor: "#0369a1",
                            color: "#ffffff",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            border: "1px solid #38bdf8",
                          }}
                        >
                          APP {item.runway.id}
                        </span>
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: "700",
                            backgroundColor: phaseBg,
                            color: phaseColor,
                            padding: "1px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {item.approachPhase}
                        </span>
                      </div>
                    </div>

                    {/* Origin & Destination Information */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "10.5px",
                        backgroundColor: "rgba(2, 132, 199, 0.12)",
                        border: "1px solid rgba(56, 189, 248, 0.18)",
                        padding: "3px 7px",
                        borderRadius: "4px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", overflow: "hidden", minWidth: 0 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "#38bdf8", fontWeight: "800", fontFamily: "monospace" }}>
                            {originDisplay || "—"}
                          </div>
                          {originPlace && <div style={{ color: "#94a3b8", fontSize: "9px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{originPlace}</div>}
                        </div>
                        <span style={{ color: "#94a3b8", fontSize: "10px", flexShrink: 0 }}>✈➔</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "#38bdf8", fontWeight: "800", fontFamily: "monospace" }}>{destDisplay}</div>
                          {destinationPlace && <div style={{ color: "#94a3b8", fontSize: "9px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{destinationPlace}</div>}
                        </div>
                      </div>

                      {item.flight.origin_country && (
                        <span style={{ fontSize: "9px", color: "#64748b", whiteSpace: "nowrap" }}>
                          {item.flight.origin_country}
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Key Approach Metrics */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.1fr 1fr 1fr 1fr",
                        gap: "4px",
                        fontSize: "10px",
                        backgroundColor: "rgba(30, 41, 59, 0.5)",
                        padding: "5px 6px",
                        borderRadius: "4px",
                        color: "#94a3b8",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "8px", color: "#64748b" }}>THR DIST</div>
                        <div style={{ color: "#f8fafc", fontWeight: "700" }}>
                          {item.alongTrackNM} <span style={{ fontSize: "8px" }}>NM</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "8px", color: "#64748b" }}>ALTITUDE</div>
                        <div style={{ color: "#4ade80", fontWeight: "700" }}>
                          {item.flight.altitude != null ? `${Math.round(item.flight.altitude)}` : "—"}{" "}
                          <span style={{ fontSize: "8px" }}>FT</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "8px", color: "#64748b" }}>SPEED</div>
                        <div style={{ color: "#facc15", fontWeight: "700" }}>
                          {item.flight.velocity != null ? `${Math.round(item.flight.velocity)}` : "—"}{" "}
                          <span style={{ fontSize: "8px" }}>KT</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "8px", color: "#64748b" }}>EST ETA</div>
                        <div style={{ color: "#38bdf8", fontWeight: "700" }}>
                          {item.timeToThresholdMin != null ? `${item.timeToThresholdMin}m` : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Vector deviation bar */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "9px",
                        color: "#64748b",
                        padding: "0 2px",
                      }}
                    >
                      <span>
                        Hdg: <strong style={{ color: "#cbd5e1" }}>{Math.round(item.flight.heading || 0)}°</strong> (Δ {item.headingDelta}°)
                      </span>
                      <span>
                        X-Track: <strong style={{ color: "#cbd5e1" }}>{item.crossTrackNM} NM</strong>
                      </span>
                      <span>
                        Est GS: <strong style={{ color: "#cbd5e1" }}>{item.estimatedGlideAngle}°</strong>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
