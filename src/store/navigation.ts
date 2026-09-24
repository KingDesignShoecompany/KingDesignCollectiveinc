import create from "zustand";

type Signals = any;

type NavState = {
  signals: Signals;
  setSignals: (s: Partial<Signals>) => void;
  activeSection: string | null;
  setActiveSection: (s: string | null) => void;
};

export const useNavStore = create<NavState>((set) => ({
  signals: {
    amplitude: { intensity: 0.5 },
    identity: {},
    persona: {},
    culture: {},
    emotion: {},
    performanceTier: "high",
  },
  setSignals: (s: Partial<Signals>) =>
    set((st) => ({ signals: { ...st.signals, ...s } })),
  activeSection: null,
  setActiveSection: (s: string | null) => set({ activeSection: s }),
}));

export default useNavStore;