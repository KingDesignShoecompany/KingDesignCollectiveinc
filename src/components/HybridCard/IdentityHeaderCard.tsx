import React from "react";
import HybridCard from "./HybridCard";

export const IdentityHeaderCard: React.FC<{
  id: string;
  signals: any;
  onExpand?: (id: string) => void;
  onDragEnd?: (id: string, x: number, y: number) => void;
  index?: number;
  region?: "TL" | "TR" | "C" | "BL" | "BR";
}> = ({ id, signals, onExpand, onDragEnd, index = 0, region = "TL" }) => {
  return (
    <HybridCard id={id} signals={signals} region={region} index={index} onExpand={onExpand} onDragEnd={onDragEnd}>
      <h3 style={{ fontFamily: "Fraunces, serif", margin: 0, color: "var(--text)" }}>
        {signals.identity?.name || "Traveler"}
      </h3>
      <p style={{ margin: 0, color: "var(--muted)" }}>{signals.identity?.subtitle || "Profile"}</p>
    </HybridCard>
  );
};

export default IdentityHeaderCard;