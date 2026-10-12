// Quantum Wearables — sensors, thermal, safety. Ported from static webapp.
export type Sensor = {
  id: string; name: string; type: string; rate: string; accuracy: string; synced: boolean; lastCal: string;
};

export const SENSORS: Sensor[] = [
  { id: 'ecg', name: 'ECG', type: 'Electrocardiogram', rate: '512 Hz', accuracy: '±0.5 mmHg', synced: true, lastCal: '2026-03-10' },
  { id: 'ppg', name: 'PPG', type: 'Photoplethysmography', rate: '100 Hz', accuracy: '±2% SpO₂', synced: true, lastCal: '2026-03-12' },
  { id: 'thermistor', name: 'Thermistor', type: 'Temperature', rate: '1 Hz', accuracy: '±0.1°C', synced: true, lastCal: '2026-03-08' },
  { id: 'imu', name: '6-axis IMU', type: 'Motion (Gyro + Accel)', rate: '200 Hz', accuracy: '±0.1°', synced: false, lastCal: '2026-03-14' },
];

export type SafetyConstraint = {
  name: string; required: string; unit: string; current: string; status: string;
};

export const SAFETY: SafetyConstraint[] = [
  { name: 'Isolation Resistance', required: '≥10', unit: 'MΩ', current: '15.2', status: 'PASS' },
  { name: 'Leakage Current', required: '≤100', unit: 'µA', current: '0.05', status: 'PASS' },
  { name: 'Max Skin Temp', required: '≤43', unit: '°C', current: '32.5', status: 'PASS' },
  { name: 'Peak Temp', required: '≤50', unit: '°C', current: '32.5', status: 'PASS' },
  { name: 'Active Coolant', required: '≤0.5', unit: 'W', current: '0', status: 'PASS' },
];

export const THERMAL_MODEL = {
  coreTemp: '37.2°C',
  surfaceTemp: '32.5°C',
  coldFission: 'Active',
  efficiency: '99.2%',
  heatFlux: '0.42 W/cm²',
};

export const WAVEFORMS = [
  { name: 'ECG', freq: '512 Hz', amplitude: '±0.5 mV', emoji: '💓' },
  { name: 'PPG', freq: '100 Hz', amplitude: '±2% SpO₂', emoji: '🩸' },
  { name: 'Thermal', freq: '1 Hz', amplitude: '±0.1°C', emoji: '🌡️' },
  { name: 'IMU', freq: '200 Hz', amplitude: '±0.1°', emoji: '🧭' },
];
