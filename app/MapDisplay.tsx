"use client";

import React from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FlightState } from "./types";
import { createPlaneIcon } from "./planeIcons";
import RunwayLayout from "./RunwayLayout";
import ApproachHUD from "./ApproachHUD";

type MapDisplayProps = {
  flights: FlightState[];
  center: { lat: number; lng: number; zoom: number };
};

export default function MapDisplay({ flights, center }: MapDisplayProps) {
  return (
    <div style={{ height: "85vh", width: "100vw", position: "relative" }}>
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
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={center.zoom}
        minZoom={10}
        maxZoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="/tiles/{z}/{x}/{y}.png"
          minZoom={10}
          maxZoom={13}
          errorTileUrl="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
        />

        {flights.map((flight) => {
          if (flight.latitude == null || flight.longitude == null) return null;

          const isMovingOnGround = flight.on_ground && flight.velocity != null && flight.velocity > 0;
          const isParked = flight.on_ground && !isMovingOnGround;
          const isHighAltitude = !flight.on_ground && flight.altitude != null && flight.altitude >= 10000;

          const icon = createPlaneIcon(L, flight.heading, flight.on_ground, flight.velocity, flight.altitude);
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
            <Marker
              key={flight.icao24}
              position={[flight.latitude, flight.longitude]}
              icon={icon}
            >
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
                    <div><strong>Country:</strong> {flight.origin_country}</div>
                    <div><strong>Origin:</strong> {flight.origin_iata || flight.origin_icao || flight.origin_city || flight.origin_name || "Unknown"}</div>
                    <div><strong>Destination:</strong> {flight.destination_iata || flight.destination_icao || flight.destination_city || flight.destination_name || "Unknown"}</div>
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
          );
        })}
      </MapContainer>
    </div>
  );
}
