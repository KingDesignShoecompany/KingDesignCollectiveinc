import React from "react";
import HybridCard from "./HybridCard";

export const DynamicModuleCard: React.FC<{
  id: string;
  signals: any;
  title?: string;
  onExpand?: (id: string) => void;
  onDragEnd?: (id: string, x: number, y: number) => void;
  index?: number;
  region?: "TL" | "TR" | "C" | "BL" | "BR";
  children?: React.ReactNode;
}> = ({ id, signals, title = "Module", onExpand, onDragEnd, index = 0, region = "C", children }) => {
  return (
    <HybridCard id={id} signals={signals} region={region} index={index} onExpand={onExpand} onDragEnd={onDragEnd}>
      <h5 style={{ margin: 0 }}>{title}</h5>
      <div style={{ marginTop: 8 }}>{children}</div>
    </HybridCard>
  );
};

export default DynamicModuleCard;