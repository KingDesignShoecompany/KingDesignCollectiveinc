import React from "react";
import { useNavStore } from "../../store/navigation";

export const Sidebar: React.FC = () => {
  const setSignals = useNavStore((s) => s.setSignals);
  const setActiveSection = useNavStore((s) => s.setActiveSection);

  return (
    <nav className="sidebar" style={{ width: 84, padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      <button
        onClick={() => {
          setSignals({ culture: { id: "paris", driftX: 0.2, driftY: -0.1, summary: "Parisian rhythm" } });
          setActiveSection("Cultural Intelligence");
        }}
        aria-label="Paris"
        style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }}
      >
        Paris
      </button>

      <button
        onClick={() => {
          setSignals({ persona: { id: "explorer" } });
          setActiveSection("Persona Evolution");
        }}
        aria-label="Explorer persona"
        style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }}
      >
        Explorer
      </button>

      <button
        onClick={() => {
          setSignals({ amplitude: { intensity: 0.9 } });
          setActiveSection("Amplitude Engine");
        }}
        aria-label="High amplitude"
        style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }}
      >
        High Amp
      </button>
    </nav>
  );
};

export default Sidebar;