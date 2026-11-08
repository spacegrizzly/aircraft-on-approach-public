"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Plane, RefreshCw } from "lucide-react";
import type Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { FlightState } from "./types";
import { createPlaneIcon, getPlaneColors } from "./planeIcons";
import RunwayLayout from "./RunwayLayout";
import ApproachHUD from "./ApproachHUD";
import PlaneLegend from "./PlaneLegend";
import Link from "next/link";
import { detectAllApproaches } from "./approachDetection";
import { FlightObservation, positionAlongPath, predictFlightPath } from "./flightPrediction";

// Dynamically import Leaflet components to prevent Next.js Server-Side Rendering (SSR) crashes
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false });

const MAP_CENTER = {
  name: "Vienna Control Sector Area Airspace",
  lat: 48.15,
  lng: 16.50,
  zoom: 12,
};

const TRACE_FADE_MS = 60 * 1000;
const HISTORY_RETENTION_MS = 3 * 60 * 1000;

export default function FlightTracker() {
  const [flights, setFlights] = useState<FlightState[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [observedAt, setObservedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [tracesEnabled, setTracesEnabled] = useState(true);
  const [predictionsEnabled, setPredictionsEnabled] = useState(true);
  const [trails, setTrails] = useState<Record<string, { points: FlightObservation[] }>>({});
  const [L, setLeaflet] = useState<typeof Leaflet | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    import("leaflet").then((leafletModule) => {
      setLeaflet(leafletModule.default);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveFlights = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/flights", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        mode: "cors"
      });
      if (!res.ok) throw new Error("Backend server error");
      const data: FlightState[] = await res.json();
      const timestamp = Date.now();
      setFlights(data);
      setObservedAt(timestamp);
      setLastUpdated(new Date(timestamp));
      setTrails((current) => {
        const updated: typeof current = {};
        const approachIds = new Set(
          Object.values(detectAllApproaches(data))
            .flat()
            .map((approach) => approach.flight.icao24)
        );
        for (const [icao24, trail] of Object.entries(current)) {
          const freshPoints = trail.points.filter((point) => timestamp - point.timestamp < HISTORY_RETENTION_MS);
          if (freshPoints.length > 0) updated[icao24] = { points: freshPoints };
        }
        for (const flight of data) {
          const previous = updated[flight.icao24];
          const { planeColor } = getPlaneColors(flight.on_ground, flight.velocity, flight.altitude);
          const observation: FlightObservation = {
            position: [flight.latitude, flight.longitude],
            timestamp,
            heading: flight.heading,
            velocity: flight.velocity,
            color: approachIds.has(flight.icao24) ? "#38bdf8" : planeColor,
          };
          updated[flight.icao24] = {
            points: [...(previous?.points ?? []), observation].slice(-12),
          };
        }
        return updated;
      });
    } catch (error) {
      console.error("Error pulling flight data from Python backend:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveFlights();
    const interval = setInterval(fetchLiveFlights, 20000);
    return () => clearInterval(interval);
  }, []);

  const approachingAircraft = useMemo(() => {
    const approaches = detectAllApproaches(flights);
    return new Set(Object.values(approaches).flat().map((approach) => approach.flight.icao24));
  }, [flights]);

  return (
    /* 🟢 BLOCK STACKING: Using standard block display prevents page elements from colliding vertically */
    <div style={{ display: "block", height: "100vh", width: "100vw", backgroundColor: "#030712" }}>

      {/* 🟢 TOP PINNED HEADER: Stays permanently at the top of the browser view viewport */}
      <header style={{
        width: "100%",
        height: "18vh",
        padding: "16px 20px",
        backgroundColor: "#090d1f",
        borderBottom: "2px solid rgba(239, 68, 68, 0.4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        boxSizing: "border-box"
      }}>

        <h1 style={{
          margin: 0,
          fontSize: "26px",
          fontWeight: "900",
          color: "#f97316",
          letterSpacing: "3px",
          textTransform: "uppercase",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px"
        }}>
          <Plane style={{ color: "#f97316", width: "24px", height: "24px" }} />
          Live Flight Tracker
        </h1>

        <p style={{
          margin: "6px 0 0 0",
          fontSize: "13px",
          fontWeight: "700",
          color: "#ef4444",
          letterSpacing: "1px",
          textTransform: "uppercase",
          fontFamily: "system-ui, sans-serif"
        }}>
          Airspace Sector: <span style={{ color: "#f97316", fontWeight: "800" }}>{MAP_CENTER.name}</span>
        </p>

        <p style={{
          margin: "4px 0 0 0",
          fontSize: "11px",
          fontWeight: "500",
          color: "#475569",
          fontFamily: "monospace"
        }}>
          {lastUpdated ? `Radar Refresh: ${lastUpdated.toLocaleTimeString()} (Updates every 20s)` : "Linking data streams..."}
        </p>

        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={fetchLiveFlights}
            disabled={loading}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #f97316",
              color: "#f97316",
              fontWeight: "700",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "system-ui, sans-serif"
            }}
          >
            <RefreshCw style={{ width: "11px", height: "11px" }} />
            Refresh Radar
          </button>
          <Link
            href="/rwy11"
            style={{
              border: "1px solid rgba(56, 189, 248, 0.7)",
              borderRadius: "6px",
              color: "#7dd3fc",
              fontSize: "11px",
              fontWeight: 700,
              padding: "6px 10px",
              textDecoration: "none",
            }}
          >
            RWY 11 Approaches
          </Link>
        </div>
      </header>

      {/* 🟢 VISIBLE RETAINED MAP CANVAS: Hardcoded to take up exactly the remaining 82% of page layout height */}
      <div style={{ height: "82vh", width: "100vw", position: "relative", display: "block" }}>
        {/* Top-Right HUD Suite: Runway Diagram and Approach Radar */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "row-reverse",
            gap: "12px",
            alignItems: "flex-start",
            maxWidth: "calc(100vw - 32px)",
            pointerEvents: "none",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <div style={{ pointerEvents: "auto" }}>
            <RunwayLayout />
          </div>
          <div style={{ pointerEvents: "auto" }}>
            <ApproachHUD flights={flights} />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: "12px",
            bottom: "12px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            maxHeight: "calc(82vh - 24px)",
            overflowY: "auto",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px 12px",
              padding: "8px 10px",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              borderRadius: "8px",
              background: "rgba(10, 15, 29, 0.94)",
              color: "#e2e8f0",
              fontSize: "11px",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
              <input type="checkbox" checked={tracesEnabled} onChange={(event) => setTracesEnabled(event.target.checked)} />
              Flight traces
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
              <input type="checkbox" checked={predictionsEnabled} onChange={(event) => setPredictionsEnabled(event.target.checked)} />
              Predicted paths (60s)
            </label>
          </div>
          <PlaneLegend style={{ width: "min(300px, calc(100vw - 24px))" }} />
        </div>

        {L && (
          <MapContainer
            center={[MAP_CENTER.lat, MAP_CENTER.lng]}
            zoom={MAP_CENTER.zoom}
            minZoom={10}
            maxZoom={13}
            style={{ height: "100%", width: "100%", position: "absolute", inset: 0 }}
            zoomControl={true}
            whenReady={() => setMapReady(true)}
          >
            {mapReady && (
              <>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="/tiles/{z}/{x}/{y}.png"
                  minZoom={10}
                  maxZoom={13}
                  errorTileUrl="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
                />

                {tracesEnabled && Object.entries(trails).flatMap(([icao24, trail]) =>
                  trail.points.slice(1).map((point, index) => {
                    const previousPoint = trail.points[index];
                    const opacity = 0.72 * Math.max(0, 1 - (now - point.timestamp) / TRACE_FADE_MS);
                    const moved = Math.abs(previousPoint.position[0] - point.position[0]) > 0.00001 ||
                      Math.abs(previousPoint.position[1] - point.position[1]) > 0.00001;
                    if (opacity <= 0 || !moved) return null;
                    return (
                      <Polyline
                        key={`trace-${icao24}-${point.timestamp}`}
                        positions={[previousPoint.position, point.position]}
                        pathOptions={{ color: point.color, weight: 2, opacity }}
                      />
                    );
                  })
                )}

                {flights.map((flight) => {
                  if (flight.latitude == null || flight.longitude == null) return null;

                  const isMovingOnGround = flight.on_ground && flight.velocity != null && flight.velocity > 0;
                  const isParked = flight.on_ground && !isMovingOnGround;
                  const isHighAltitude = !flight.on_ground && flight.altitude != null && flight.altitude >= 10000;
                  const secondsSinceUpdate = observedAt == null ? 0 : Math.min(60, Math.max(0, (now - observedAt) / 1000));
                  const predictionPath = predictionsEnabled
                    ? predictFlightPath(flight, trails[flight.icao24]?.points ?? [])
                    : [];
                  const markerPosition: [number, number] =
                    positionAlongPath(predictionPath, secondsSinceUpdate) ?? [flight.latitude, flight.longitude];
                  const canPredict = predictionPath.length > 1;
                  const predictionStep = Math.min(
                    Math.floor(secondsSinceUpdate / 5),
                    predictionPath.length - 1
                  );
                  const predictionTrail = predictionPath.slice(0, predictionStep + 1);
                  if (
                    canPredict &&
                    secondsSinceUpdate > 0 &&
                    (predictionTrail.length === 0 ||
                      predictionTrail[predictionTrail.length - 1][0] !== markerPosition[0] ||
                      predictionTrail[predictionTrail.length - 1][1] !== markerPosition[1])
                  ) {
                    predictionTrail.push(markerPosition);
                  }
                  const isApproach = approachingAircraft.has(flight.icao24);
                  const { planeColor } = getPlaneColors(flight.on_ground, flight.velocity, flight.altitude);
                  const aircraftColor = isApproach ? "#38bdf8" : planeColor;
                  const icon = L
                    ? createPlaneIcon(L, flight.heading, flight.on_ground, flight.velocity, flight.altitude, isApproach)
                    : null;
                  if (!icon) return null;

                  let badgeBg = "#dcfce7";
                  let badgeColor = "#15803d";
                  let badgeLabel = "Airborne";

                  if (isParked) {
                    badgeBg = "#e2e8f0";
                    badgeColor = "#475569";
                    badgeLabel = "Parked";
                  } else if (isMovingOnGround) {
                    badgeBg = "#fef9c3";
                    badgeColor = "#854d0e";
                    badgeLabel = "Moving (Ground)";
                  } else if (isHighAltitude) {
                    badgeBg = "#f1f5f9";
                    badgeColor = "#0f172a";
                    badgeLabel = "Airborne (≥10k ft)";
                  }

                  return (
                    <React.Fragment key={flight.icao24}>
                      {canPredict && secondsSinceUpdate > 0 && (
                        <Polyline
                          positions={predictionTrail}
                          pathOptions={{ color: aircraftColor, weight: 2, opacity: 0.8, dashArray: "5 6" }}
                        />
                      )}
                      <Marker position={markerPosition} icon={icon}>
                        <Popup>
                          <div style={{ minWidth: "190px", fontFamily: "system-ui, -apple-system, sans-serif", padding: "2px" }}>
                            <h3 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #e2e8f0", paddingBottom: "4px" }}>
                              <span>✈️ {flight.callsign}</span>
                              <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", backgroundColor: badgeBg, color: badgeColor, fontWeight: "700" }}>
                                {badgeLabel}
                              </span>
                            </h3>
                            <div style={{ fontSize: "12px", lineHeight: "1.5", color: "#334155" }}>
                              <div>
                                <strong>Type:</strong>{" "}
                                {flight.aircraft_type ? (
                                  <span style={{ color: "#0284c7", fontWeight: "700" }}>{flight.aircraft_type}</span>
                                ) : (
                                  <span style={{ color: "#94a3b8" }}>N/A</span>
                                )}
                              </div>
                              <div><strong>ICAO Hex:</strong> <span style={{ fontFamily: "monospace", color: "#64748b" }}>{flight.icao24.toUpperCase()}</span></div>
                              <div><strong>Origin:</strong> {flight.origin_iata || flight.origin_icao || flight.origin_city || flight.origin_name || "Unknown"}</div>
                              <div><strong>Destination:</strong> {flight.destination_iata || flight.destination_icao || flight.destination_city || flight.destination_name || "Unknown"}</div>
                              <div><strong>Country:</strong> {flight.origin_country}</div>
                              <div><strong>Altitude:</strong> {flight.altitude != null ? `${Math.round(flight.altitude).toLocaleString()} ft` : "N/A"}</div>
                              <div><strong>Speed:</strong> {flight.velocity != null ? `${Math.round(flight.velocity).toLocaleString()} kts` : "N/A"}</div>
                              <div><strong>Heading:</strong> {flight.heading != null ? `${Math.round(flight.heading)}°` : "N/A"}</div>
                              {flight.vertical_rate != null && (
                                <div>
                                  <strong>Vertical Rate:</strong>{" "}
                                  <span style={{ color: flight.vertical_rate > 100 ? "#0284c7" : flight.vertical_rate < -100 ? "#16a34a" : "#64748b", fontWeight: "600" }}>
                                    {flight.vertical_rate > 0 ? `+${Math.round(flight.vertical_rate)}` : `${Math.round(flight.vertical_rate)}`} ft/min
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
