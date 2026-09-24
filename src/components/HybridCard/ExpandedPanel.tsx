import React from "react";
import { motion } from "framer-motion";

export const ExpandedPanel: React.FC<{ id: string; onClose: () => void; content: React.ReactNode }> = ({
  id,
  onClose,
  content,
}) => {
  return (
    <motion.div
      className="expanded-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        pointerEvents: "auto",
      }}
    >
      <motion.div
        style={{
          width: "min(920px, 92vw)",
          borderRadius: 16,
          padding: 24,
          background: "rgba(10,12,14,0.92)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          position: "relative",
        }}
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
      >
        <button
          onClick={onClose}
          aria-label="Close panel"
          style={{ position: "absolute", right: 20, top: 20, background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }}
        >
          ✕
        </button>
        <div>{content}</div>
      </motion.div>
    </motion.div>
  );
};

export default ExpandedPanel;