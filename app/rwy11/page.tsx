"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plane, RefreshCw } from "lucide-react";
import { ApproachFlight, detectAllApproaches } from "../approachDetection";
import { FlightState } from "../types";

const DEFAULT_LOCATION = { lat: 48.1845, lon: 16.3122 };

const AIRLINES: { prefix: string; name: string }[] = [
  { prefix: "AUA", name: "Austrian Airlines" },
  { prefix: "DLH", name: "Lufthansa" },
  { prefix: "EWG", name: "Eurowings" },
  { prefix: "WZZ", name: "Wizz Air" },
  { prefix: "RYR", name: "Ryanair" },
  { prefix: "BAW", name: "British Airways" },
  { prefix: "KLM", name: "KLM" },
  { prefix: "AFR", name: "Air France" },
  { prefix: "SAS", name: "SAS" },
  { prefix: "EZY", name: "easyJet" },
  { prefix: "THY", name: "Turkish Airlines" },
  { prefix: "UAE", name: "Emirates" },
  { prefix: "QTR", name: "Qatar Airways" },
  { prefix: "SWR", name: "SWISS" },
  { prefix: "LOT", name: "LOT Polish Airlines" },
  { prefix: "TAP", name: "TAP Air Portugal" },
  { prefix: "BEL", name: "Brussels Airlines" },
  { prefix: "FIN", name: "Finnair" },
];

function airlineForCallsign(callsign: string) {
  const prefix = callsign.trim().toUpperCase().match(/^[A-Z]{3}/)?.[0];
  return AIRLINES.find((airline) => airline.prefix === prefix) ?? null;
}

function airportCode(iata?: string | null, icao?: string | null) {
  return iata || icao || "Unknown";
}

function airportPlace(city?: string | null, name?: string | null) {
  return city || name || "Airport details unavailable";
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = radians(lat2 - lat1);
  const deltaLon = radians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Runway11Page() {
  const [flights, setFlights] = useState<FlightState[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationLat, setLocationLat] = useState(String(DEFAULT_LOCATION.lat));
  const [locationLon, setLocationLon] = useState(String(DEFAULT_LOCATION.lon));
  const [displayedApproaches, setDisplayedApproaches] = useState<
    { approach: ApproachFlight; phase: "entering" | "visible" | "exiting" }[]
  >([]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/flights", { cache: "no-store" });
        if (!response.ok) throw new Error(`Flight service returned ${response.status}`);
        const data: FlightState[] = await response.json();
        if (active) {
          setFlights(data);
          setUpdatedAt(new Date());
          setError(null);
        }
      } catch (fetchError) {
        if (active) setError(fetchError instanceof Error ? fetchError.message : "Unable to load flight data.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void refresh();
    const interval = setInterval(refresh, 20000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const approaches = useMemo(() => detectAllApproaches(flights)["11"], [flights]);

  useEffect(() => {
    const activeIds = new Set(approaches.map((approach) => approach.flight.icao24));
    setDisplayedApproaches((current) => {
      const previousById = new Map(current.map((entry) => [entry.approach.flight.icao24, entry]));
      const active = approaches.map((approach) => ({
        approach,
        phase: previousById.has(approach.flight.icao24) ? "visible" as const : "entering" as const,
      }));
      const leaving = current
        .filter((entry) => !activeIds.has(entry.approach.flight.icao24))
        .map((entry) => ({ ...entry, phase: "exiting" as const }));
      return [...active, ...leaving];
    });

    const frame = requestAnimationFrame(() => {
      setDisplayedApproaches((current) =>
        current.map((entry) =>
          activeIds.has(entry.approach.flight.icao24) && entry.phase === "entering"
            ? { ...entry, phase: "visible" }
            : entry
        )
      );
    });
    const cleanup = setTimeout(() => {
      setDisplayedApproaches((current) =>
        current.filter((entry) => activeIds.has(entry.approach.flight.icao24))
      );
    }, 700);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(cleanup);
    };
  }, [approaches]);

  const referenceLocation = useMemo(() => {
    const lat = Number(locationLat);
    const lon = Number(locationLon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return null;
    }
    return { lat, lon };
  }, [locationLat, locationLon]);
  const closestAircraft = useMemo(() => {
    if (!referenceLocation || approaches.length === 0) return null;
    return approaches.reduce((closest, item) => {
      const distance = distanceKm(referenceLocation.lat, referenceLocation.lon, item.flight.latitude, item.flight.longitude);
      return !closest || distance < closest.distance
        ? { icao24: item.flight.icao24, distance }
        : closest;
    }, null as { icao24: string; distance: number } | null);
  }, [approaches, referenceLocation]);

  return (
    <main
      style={{
        height: "100dvh",
        overflowY: "auto",
        boxSizing: "border-box",
        padding: "clamp(12px, 3vw, 28px)",
        background: "#030712",
        color: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "760px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            paddingBottom: "14px",
            borderBottom: "1px solid #1e293b",
          }}
        >
          <div>
            <div style={{ color: "#38bdf8", fontSize: "11px", fontWeight: 800, letterSpacing: "1.5px" }}>LOWW / VIE</div>
            <h1 style={{ margin: "3px 0 0", fontSize: "clamp(21px, 5vw, 30px)", lineHeight: 1.15 }}>RWY 11 Approaches</h1>
            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>Inbound heading 114° · Updates every 20 seconds</div>
          </div>
          <Link
            href="/"
            aria-label="Back to live radar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "8px 10px",
              color: "#cbd5e1",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <ArrowLeft size={15} /> <span>Radar</span>
          </Link>
        </header>

        <section style={{ paddingTop: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: 700 }}>
              {approaches.length} {approaches.length === 1 ? "aircraft" : "aircraft"} on approach
            </div>
            <div style={{ color: "#64748b", fontSize: "10px", textAlign: "right" }}>
              {updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : loading ? "Connecting…" : "No data"}
            </div>
          </div>

          <details
            style={{
              marginBottom: "10px",
              padding: "9px 11px",
              border: "1px solid #334155",
              borderRadius: "8px",
              background: "rgba(15, 23, 42, 0.75)",
            }}
          >
            <summary style={{ cursor: "pointer", color: "#cbd5e1", fontSize: "11px", fontWeight: 700 }}>
              Change nearest-aircraft location
            </summary>
            <div style={{ color: "#94a3b8", fontSize: "10px", margin: "8px 0" }}>
              Default: Schönbrunn, Vienna. Enter coordinates to use another location.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", alignItems: "end", gap: "7px" }}>
              {[
                ["Latitude", locationLat, setLocationLat, "-90 to 90"],
                ["Longitude", locationLon, setLocationLon, "-180 to 180"],
              ].map(([label, value, setter, placeholder]) => (
                <label key={label as string} style={{ color: "#94a3b8", fontSize: "10px" }}>
                  {label as string}
                  <input
                    type="number"
                    step="any"
                    min={label === "Latitude" ? -90 : -180}
                    max={label === "Latitude" ? 90 : 180}
                    value={value as string}
                    placeholder={placeholder as string}
                    onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                    style={{
                      display: "block",
                      boxSizing: "border-box",
                      width: "100%",
                      marginTop: "4px",
                      padding: "7px",
                      border: "1px solid #334155",
                      borderRadius: "5px",
                      outlineColor: "#f97316",
                      background: "#030712",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                  />
                </label>
              ))}
              <button
                type="button"
                onClick={() => {
                  setLocationLat(String(DEFAULT_LOCATION.lat));
                  setLocationLon(String(DEFAULT_LOCATION.lon));
                }}
                style={{
                  padding: "7px 8px",
                  border: "1px solid #475569",
                  borderRadius: "5px",
                  background: "transparent",
                  color: "#cbd5e1",
                  fontSize: "10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Reset
              </button>
            </div>
            {!referenceLocation && <div role="alert" style={{ marginTop: "7px", color: "#fca5a5", fontSize: "10px" }}>Enter a valid latitude and longitude.</div>}
          </details>

          {error && (
            <div role="alert" style={{ marginBottom: "10px", border: "1px solid #7f1d1d", borderRadius: "8px", padding: "9px 11px", background: "rgba(127, 29, 29, 0.2)", color: "#fecaca", fontSize: "12px" }}>
              Flight data unavailable: {error}
            </div>
          )}

          {displayedApproaches.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "18px 14px", border: "1px dashed #334155", borderRadius: "10px", color: "#94a3b8" }}>
              <Plane size={20} />
              <div>
                <div style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 700 }}>No aircraft currently on final for RWY 11</div>
                <div style={{ fontSize: "11px", marginTop: "3px" }}>The approach list will refresh automatically.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid" }}>
              {displayedApproaches.map(({ approach: item, phase }) => (
                (() => {
                  const airline = airlineForCallsign(item.flight.callsign);
                  const isClosest = item.flight.icao24 === closestAircraft?.icao24;
                  const isHighAltitude = item.flight.altitude != null && item.flight.altitude >= 10000;
                  return (
                    <div
                      key={item.flight.icao24}
                      style={{
                        display: "grid",
                        gridTemplateRows: phase === "exiting" ? "0fr" : "1fr",
                        opacity: phase === "exiting" ? 0 : 1,
                        marginBottom: phase === "exiting" ? 0 : "8px",
                        overflow: "hidden",
                        transition: "grid-template-rows 500ms ease, opacity 500ms ease, margin-bottom 500ms ease",
                      }}
                    >
                      <div style={{ minHeight: 0, overflow: "hidden" }}>
                    <article
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        opacity: phase === "visible" ? 1 : 0,
                        transform: phase === "visible"
                          ? "translateY(0)"
                          : phase === "entering"
                            ? "translateY(16px)"
                            : "translateY(-16px)",
                        transition: "opacity 500ms ease, transform 500ms ease, border-color 500ms ease, box-shadow 500ms ease",
                        border: isClosest ? "2px solid #f97316" : "1px solid #1e3a50",
                        borderRadius: "10px",
                        padding: "12px",
                        background: isClosest
                          ? "linear-gradient(135deg, rgba(67, 36, 14, 0.6), rgba(8, 47, 73, 0.5))"
                          : "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(8, 47, 73, 0.42))",
                        boxShadow: isClosest ? "0 0 16px rgba(249, 115, 22, 0.24)" : "none",
                      }}
                    >
                      <div style={{ position: "relative", zIndex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                        <div
                          aria-hidden="true"
                          style={{
                            width: "42px",
                            height: "42px",
                            flex: "0 0 42px",
                            display: "grid",
                            placeItems: "center",
                            borderRadius: "8px",
                            border: "1px solid rgba(56, 189, 248, 0.28)",
                            background: "rgba(15, 23, 42, 0.82)",
                          }}
                        >
                          <Plane size={27} color={isHighAltitude ? "#ffffff" : "#38bdf8"} strokeWidth={1.8} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                            <strong style={{ fontSize: "15px", color: "#fff" }}>{item.flight.callsign}</strong>
                            {isClosest && (
                              <span style={{ borderRadius: "4px", padding: "2px 6px", background: "rgba(249, 115, 22, 0.2)", color: "#fdba74", fontSize: "9px", fontWeight: 800 }}>
                                CLOSEST · {closestAircraft.distance.toFixed(1)} KM
                              </span>
                            )}
                          </div>
                          <div style={{ color: "#7dd3fc", fontSize: "10px", fontWeight: 700, marginTop: "3px" }}>
                            {airline?.name ?? "Airline not identified"}
                            {item.flight.aircraft_type && <span style={{ color: "#94a3b8", fontWeight: 500 }}> · {item.flight.aircraft_type}</span>}
                          </div>
                        </div>
                        <span style={{ flexShrink: 0, color: "#bae6fd", background: "rgba(2, 132, 199, 0.25)", border: "1px solid #0369a1", borderRadius: "6px", padding: "4px 7px", fontSize: "10px", fontWeight: 800 }}>
                          {item.approachPhase}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "8px", marginTop: "11px", padding: "9px 10px", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "7px", background: "rgba(2, 132, 199, 0.1)" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "#7dd3fc", fontSize: "9px", fontWeight: 800, letterSpacing: "0.8px" }}>ORIGIN</div>
                          <div style={{ color: "#f8fafc", fontSize: "16px", fontWeight: 900, lineHeight: 1.2, marginTop: "2px" }}>
                            {airportCode(item.flight.origin_iata, item.flight.origin_icao)}
                          </div>
                          <div style={{ color: "#94a3b8", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
                            {airportPlace(item.flight.origin_city, item.flight.origin_name)}
                          </div>
                        </div>
                        <span aria-hidden="true" style={{ color: "#38bdf8", fontSize: "18px" }}>→</span>
                        <div style={{ minWidth: 0, textAlign: "right" }}>
                          <div style={{ color: "#7dd3fc", fontSize: "9px", fontWeight: 800, letterSpacing: "0.8px" }}>DESTINATION</div>
                          <div style={{ color: "#f8fafc", fontSize: "16px", fontWeight: 900, lineHeight: 1.2, marginTop: "2px" }}>
                            {airportCode(item.flight.destination_iata, item.flight.destination_icao)}
                          </div>
                          <div style={{ color: "#94a3b8", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
                            {airportPlace(item.flight.destination_city, item.flight.destination_name)}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                          gap: "6px",
                          marginTop: "8px",
                        }}
                      >
                        {[
                          ["DIST", `${item.alongTrackNM} NM`],
                          ["ALT", item.flight.altitude == null ? "—" : `${Math.round(item.flight.altitude).toLocaleString()} ft`],
                          ["SPEED", item.flight.velocity == null ? "—" : `${Math.round(item.flight.velocity)} kt`],
                          ["ETA", item.timeToThresholdMin == null ? "—" : `${item.timeToThresholdMin} min`],
                        ].map(([label, value]) => (
                          <div key={label} style={{ minWidth: 0, padding: "7px", borderRadius: "6px", background: "rgba(30, 41, 59, 0.7)" }}>
                            <div style={{ color: "#64748b", fontSize: "9px", fontWeight: 800 }}>{label}</div>
                            <div style={{ color: "#f8fafc", fontSize: "11px", fontWeight: 700, marginTop: "2px", whiteSpace: "nowrap" }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      </div>
                    </article>
                      </div>
                    </div>
                  );
                })()
              ))}
            </div>
          )}

          <div style={{ marginTop: "12px", color: "#64748b", fontSize: "10px", display: "flex", alignItems: "center", gap: "5px" }}>
            <RefreshCw size={11} /> {loading ? "Loading flight data" : "Live approach monitor"}
          </div>
        </section>
      </div>
    </main>
  );
}
