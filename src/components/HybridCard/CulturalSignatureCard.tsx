import React from "react";
import HybridCard from "./HybridCard";

export const CulturalSignatureCard: React.FC<{
  id: string;
  signals: any;
  onExpand?: (id: string) => void;
  onDragEnd?: (id: string, x: number, y: number) => void;
  index?: number;
  region?: "TL" | "TR" | "C" | "BL" | "BR";
}> = ({ id, signals, onExpand, onDragEnd, index = 0, region = "TR" }) => {
  return (
    <HybridCard id={id} signals={signals} region={region} index={index} onExpand={onExpand} onDragEnd={onDragEnd}>
      <h4 style={{ margin: 0, fontFamily: "Fraunces Italic, serif", color: "var(--accent)" }}>Cultural Signature</h4>
      <p style={{ marginTop: 8, color: "var(--muted)" }}>{signals.culture?.summary || "Local rhythms and notes"}</p>
    </HybridCard>
  );
};

export default CulturalSignatureCard;