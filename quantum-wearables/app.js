// Quantum Wearables - Biometric Monitoring & Thermal Management JS

// Sensor specifications
const SENSORS = [
    { id: 'ecg', name: 'ECG', type: 'Electrocardiogram', rate: '512 Hz', accuracy: '±0.5mmHg', synced: true, lastCal: '2026-03-10' },
    { id: 'ppg', name: 'PPG', type: 'Photoplethysmography', rate: '100 Hz', accuracy: '±2% SpO2', synced: true, lastCal: '2026-03-12' },
    { id: 'thermistor', name: 'Thermistor', type: 'Temperature', rate: '1 Hz', accuracy: '±0.1°C', synced: true, lastCal: '2026-03-08' },
    { id: 'imu', name: '6-axis IMU', type: 'Motion (Gyro + Accel)', rate: '200 Hz', accuracy: '±0.1°', synced: false, lastCal: '2026-03-14' },
];

// Safety constraints
const SAFETY_CONSTRAINTS = {
    isolationResistance: { required: 10, unit: 'MΩ', current: 15.2, status: 'PASS' },
    leakageCurrent: { required: 100, unit: 'µA', current: 0.05, status: 'PASS' },
    maxSkinTemp: { required: 43, unit: '°C', current: 32.5, status: 'PASS' },
    peakTemp: { required: 50, unit: '°C', duration: '5 min', current: 32.5, status: 'PASS' },
    activeCoolant: { limit: 0.5, unit: 'W', current: 0, status: 'PASS' },
};

document.addEventListener('DOMContentLoaded', function() {
    initializeQuantumApp();
});

function initializeQuantumApp() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (currentPage === 'index.html' || currentPage === '') {
        initDashboard();
    } else if (currentPage === 'thermal.html') {
        initThermalModel();
    } else if (currentPage === 'sensors.html') {
        initSensorMonitor();
    } else if (currentPage === 'safety.html') {
        initSafetyDashboard();
    }
}

function initDashboard() {
    // Update core metrics
    document.getElementById('coreTemp').textContent = 'Core: 37.2°C';
    document.getElementById('skinTemp').textContent = '32.5';
    document.getElementById('coreBiometrics').textContent = '72';
    document.getElementById('coreOutput').textContent = '0.3';
    document.getElementById('devicesCount').textContent = '3';

    // Safety status check
    checkSafetyConstraints();
}

function initThermalModel() {
    calculateThermal();
    updateConstraintStatus();
}

function calculateThermal() {
    const mass = parseFloat(document.getElementById('massInput')?.value || 50);
    const specificHeat = parseFloat(document.getElementById('specificHeat')?.value || 0.897);
    const deltaTemp = parseFloat(document.getElementById('deltaTemp')?.value || 15);
    const ambientTemp = parseFloat(document.getElementById('ambientTemp')?.value || 20);
    const emissivity = parseFloat(document.getElementById('emissivity')?.value || 0.85);
    const surfaceArea = parseFloat(document.getElementById('surfaceArea')?.value || 800);
    const peakTemp = parseFloat(document.getElementById('peakTemp')?.value || 42);
    const duration = parseFloat(document.getElementById('duration')?.value || 5);

    // Q = m * c * ΔT (Joules)
    const heatEnergy = mass * specificHeat * deltaTemp;

    // Stefan-Boltzmann: P = ε * σ * A * (T^4 - T_ambient^4)
    const sigma = 5.67e-8; // Stefan-Boltzmann constant W/m²K⁴
    const tempCelsius = ambientTemp + deltaTemp;
    const tempKelvin = tempCelsius + 273.15;
    const ambientKelvin = ambientTemp + 273.15;
    const surfaceM2 = surfaceArea / 10000; // Convert cm² to m²
    const radiatedPower = emissivity * sigma * surfaceM2 * (Math.pow(tempKelvin, 4) - Math.pow(ambientKelvin, 4));

    // Update results
    if (document.getElementById('resultQ')) {
        document.getElementById('resultQ').textContent = `${heatEnergy.toFixed(2)} J`;
        document.getElementById('resultP').textContent = `${radiatedPower.toFixed(2)} W`;
        document.getElementById('resultDelta').textContent = `${deltaTemp.toFixed(1)}°C`;

        // Check if within constraints
        const constraintBox = document.querySelector('#thermalResults .result-item:last-child .status-safe, #thermalResults .result-item:last-child .status-violation');
        if (peakTemp <= 43 && radiatedPower < 0.5) {
            if (!document.querySelector('.status-safe')) {
                document.querySelector('#thermalResults .result-item:last-child').innerHTML = '<span>Constraint Status:</span><span class="status-safe">PASS</span>';
            }
        } else {
            document.querySelector('#thermalResults .result-item:last-child').innerHTML = '<span>Constraint Status:</span><span class="status-violation">VIOLATION</span>';
        }
    }
}

function updateConstraintStatus() {
    const constraints = document.querySelectorAll('.constraint-item');
    const constraintData = [
        { status: 'PASS', el: '#constraintSkin' },
        { status: 'PASS', el: '#constraintPeak' },
        { status: 'PASS', el: '#constraintCoolant' },
        { status: 'PASS', el: '#constraintPassive' },
    ];

    constraintData.forEach(c => {
        const el = document.querySelector(c.el);
        if (el) {
            el.textContent = c.status;
            el.className = 'constraint-status status-ok';
        }
    });
}

function initSensorMonitor() {
    // Simulate live sensor data with periodic updates
    setInterval(() => {
        const heartRate = 70 + Math.floor(Math.random() * 10);
        const spo2 = 96 + Math.floor(Math.random() * 4);
        const temp = 32 + Math.random();

        const hrEl = document.getElementById('ecgHeartRate');
        const spEl = document.getElementById('ppgSpo2');
        const tempEl = document.getElementById('tempReading');

        if (hrEl) hrEl.textContent = heartRate;
        if (spEl) spEl.textContent = spo2;
        if (tempEl) tempEl.textContent = temp.toFixed(1);

        // Update core if visible
        const coreEl = document.getElementById('coreTemp');
        if (coreEl) coreEl.textContent = `Core: ${(36.5 + Math.random()).toFixed(1)}°C`;
    }, 3000);
}

function initSafetyDashboard() {
    checkSafetyConstraints();
    const safetyStatus = document.getElementById('safetyStatus');
    if (safetyStatus) {
        safetyStatus.textContent = 'ALL SYSTEMS NOMINAL';
        safetyStatus.className = 'status-badge ok';
    }
}

function checkSafetyConstraints() {
    const status = SAFETY_CONSTRAINTS.isolationResistance.status === 'PASS' &&
                   SAFETY_CONSTRAINTS.leakageCurrent.status === 'PASS';
    return status;
}

function testEmergencyShutdown() {
    const confirmed = confirm('TEST EMERGENCY SHUTDOWN\n\nThis will simulate a critical safety breach.\nProceed?');
    if (confirmed) {
        alert('Emergency shutdown test initiated:\n\n1. Constraint violation detected (simulated)\n2. Core power reduced to 0W\n3. Haptic alert sent\n4. Visual warning displayed\n5. Treasury payload frozen\n\nTest complete. All systems nominal.');
    }
}
