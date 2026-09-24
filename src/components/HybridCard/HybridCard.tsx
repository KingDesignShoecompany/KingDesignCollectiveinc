import React from "react";
import { motion } from "framer-motion";

export type HybridCardProps = {
  id: string;
  region?: "TL" | "TR" | "C" | "BL" | "BR";
  index?: number;
  signals: any;
  className?: string;
  onExpand?: (id: string) => void;
  onDragEnd?: (id: string, x: number, y: number) => void;
  children?: React.ReactNode;
};

const GLASS_STYLE: React.CSSProperties = {
  position: "absolute",
  width: 320,
  minHeight: 96,
  borderRadius: 12,
  overflow: "hidden",
  backdropFilter: "blur(10px)",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
  willChange: "transform, opacity",
};

// Hook placeholders — replace with imports from your verified hooks
function useAdaptivePosition(_: any) { return { x: 0, y: 0 }; }
function useAmplitudeMotion(_: any) { return { elevation: 0, scale: 1 }; }
function useIdentityMotion(_: any) { return { offsetX: 0, offsetY: 0 }; }
function usePersonaMotion(_: any) { return { rotate: 0, stiffness: 140, damping: 18 }; }
function useCulturalMotion(_: any) { return { offsetX: 0, offsetY: 0 }; }
function useEmotionalMotion(_: any) { return { intensity: 0.12 }; }

export const HybridCard: React.FC<HybridCardProps> = ({
  id,
  region = "C",
  index = 0,
  signals,
  className,
  onExpand,
  onDragEnd,
  children,
}) => {
  const adaptive = useAdaptivePosition({ id, region, index, signals });
  const amplitude = useAmplitudeMotion(signals);
  const identity = useIdentityMotion(signals);
  const persona = usePersonaMotion(signals);
  const cultural = useCulturalMotion(signals);
  const emotional = useEmotionalMotion(signals);

  const targetX = adaptive.x + cultural.offsetX + identity.offsetX;
  const targetY = adaptive.y + cultural.offsetY + identity.offsetY + amplitude.elevation;

  const motionStyle = {
    x: targetX,
    y: targetY,
    rotate: persona.rotate || 0,
    scale: amplitude.scale || 1,
  };

  return (
    <motion.div
      className={`hybrid-card ${className || ""}`}
      style={GLASS_STYLE}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 20 }}
      drag
      dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
      onDragEnd={(e, info) => onDragEnd?.(id, info.point.x, info.point.y)}
      whileHover={{ scale: 1.03 }}
      role="group"
      aria-roledescription="interactive intelligence card"
    >
      <div
        className="hybrid-card__texture"
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/textures/linen.png')",
          opacity: 0.06,
          mixBlendMode: "overlay",
          borderRadius: 12,
          pointerEvents: "none",
        }}
      />

      <motion.div
        className="hybrid-card__motion"
        style={{ transformOrigin: "center center", position: "relative", zIndex: 2 }}
        animate={motionStyle}
        transition={{ type: "spring", stiffness: persona.stiffness || 140, damping: persona.damping || 18 }}
      >
        <div className="hybrid-card__content" style={{ padding: 16 }}>
          {children}
          <div style={{ height: 8 }} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              aria-label="Expand"
              onClick={() => onExpand?.(id)}
              className="hybrid-card__expand"
              style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer" }}
            >
              ⤢
            </button>
          </div>
        </div>
      </motion.div>

      <div
        className="hybrid-card__warmth"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 12,
          background: `linear-gradient(180deg, rgba(201,162,122,${Math.min(0.6, emotional.intensity)}) 0%, transparent 60%)`,
          pointerEvents: "none",
          mixBlendMode: "soft-light",
          zIndex: 1,
        }}
      />
    </motion.div>
  );
};

export default HybridCard;
