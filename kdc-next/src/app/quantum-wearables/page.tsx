'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import SectionHeader from '../../components/SectionHeader';
import { SENSORS, THERMAL_MODEL, WAVEFORMS } from '../../data/quantum';

const cardStyle = { textDecoration: 'none', color: 'inherit' };

// ─── Animated 3D-feel device (pure CSS, no Three.js) ─────────────────────
function QuantumDevice() {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    let raf: number;
    let lastX = 0;
    let lastY = 0;

    function tick() {
      const elParent = el.parentElement;
      const x = elParent?.offsetWidth ?? 0;
      const y = elParent?.offsetHeight ?? 0;
      el.style.transform = `rotateX(${lastY * 0.02}deg) rotateY(${lastX * 0.02}deg)`;
      raf = requestAnimationFrame(tick);
      lastX += (x * 0.04 - lastX) * 0.06;
      lastY += (y * 0.04 - lastY) * 0.06;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="quantum-device"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="qd-ring r1" style={{ transform: 'rotateX(70deg)' }}></div>
      <div className="qd-ring r2" style={{ animationDelay: '1s' }}></div>
      <div className="qd-ring r3" style={{ animationDelay: '2s' }}></div>
      <div
        className="qd-core"
        style={{
          boxShadow: hover ? '0 0 44px rgba(212,175,55,0.5)' : '0 0 26px rgba(212,175,55,0.35)',
        }}
      >
        <div className="qd-core-inner" />
        {[0.5, 1, 1.5, 2].map((d) => (
          <span
            key={d}
            className="qd-spark"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </div>
      <div className="qd-node n1" />
      <div className="qd-node n2" />
      <div className="qd-node n3" />
      <div className="qd-node n4" />
      <div className="qd-legend">
        <span className="qd-core-txt">QUANTUM CORE</span>
        <span className="qd-core-txt">BIO INTERFACE</span>
        <span className="qd-core-txt">SENSOR ARRAY</span>
      </div>
    </div>
  );
}

// ─── GPU particle canvas ────────────────────────────────────────────────────
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0;
    let h = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    }
    window.addEventListener('resize', resize);
    resize();

    const particles = Array.from({ length: 140 }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 1.5 + Math.random() * 2.5,
      pulse: Math.random() * Math.PI * 2,
      alpha: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
    }));

    function frame() {
      const t = performance.now() / 1000;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx + Math.sin(t + p.phase) * 0.06;
        p.y += p.vy + Math.cos(t * 0.7 + p.phase) * 0.06;
        p.pulse += 0.03;
        p.alpha = (0.15 + Math.sin(p.pulse) * 0.12) * (0.8 + Math.sin(t * 0.9 + p.phase) * 0.2);
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.6 + Math.sin(t * 1.2 + p.phase) * 0.2), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.alpha.toFixed(3)})`;
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    frame();
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── 2D heart waveform ─────────────────────────────────────────────────────
function WaveformHud({ color = '#d4af37' }: { color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [clock, setClock] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    function frame() {
      setClock((c) => c + 0.025);
      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      for (let x = 0; x < W; x += 2) {
        const yy =
          H / 2 +
          Math.sin(clock + x * 0.045) * 18 +
          Math.sin(clock * 1.7 + x * 0.02) * 8;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      requestAnimationFrame(frame);
    }
    frame();
  }, [color]);

  return (
    <canvas
      ref={ref}
      style={{
        width: '100%',
        height: 44,
        display: 'block',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.02)',
      }}
    />
  );
}

// ─── Product carousel ──────────────────────────────────────────────────────
function ProductRow({
  title,
  tag,
  desc,
  ico,
  color,
}: {
  title: string;
  tag: string;
  desc: string;
  ico: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: '26px 28px',
        borderRadius: 12,
        background: 'rgba(212,175,55,0.04)',
        border: '1px solid rgba(212,175,55,0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: '2.2rem', opacity: 0.9 }}>{ico}</div>
      <h3 style={{ color: '#e0e0e0', margin: '10px 0 6px', fontSize: '1.25rem' }}>
        {title}
      </h3>
      <div
        style={{
          color: '#d4af37',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}
      >
        {tag}
      </div>
      <p
        style={{
          color: 'var(--muted)',
          marginTop: 8,
          fontSize: '0.9rem',
          lineHeight: 1.5,
        }}
      >
        {desc}
      </p>
      <div
        style={{
          marginTop: 12,
          color: '#d4af37',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: 2,
          display: 'inline-flex',
          gap: 6,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {color} Explore
        </span>
      </div>
    </div>
  );
}

// ─── Interactive sensor network ────────────────────────────────────────────
function SensorGrid() {
  const [active, setActive] = useState('ecg');

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        {SENSORS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            style={{
              background: active === s.id ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.03)',
              color: active === s.id ? '#d4af37' : 'var(--muted)',
              border: active === s.id
                ? '1px solid rgba(212,175,55,0.35)'
                : '1px solid rgba(255,255,255,0.07)',
              padding: '7px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: 1.6,
            }}
          >
            {s.name} · {s.rate}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 18,
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: active === 'ecg' ? '#d4af37' : 'var(--muted)',
                boxShadow: active === 'ecg' ? '0 0 6px rgba(212,175,55,0.5)' : 'none',
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}
            >
              {SENSORS.find((s) => s.id === active)?.name}
            </span>
          </div>
          <WaveformHud
            color={active === 'ecg' ? '#d4af37' : 'rgba(255,255,255,0.3)'}
          />
        </div>

        <div
          style={{
            flex: 0,
            flexBasis: 180,
            padding: 14,
            background: 'rgba(212,175,55,0.05)',
            borderRadius: 8,
            border: '1px solid rgba(212,175,55,0.12)',
          }}
        >
          <div
            style={{
              color: '#d4af37',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 10,
            }}
          >
            Live Signals
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              color: 'var(--muted)',
            }}
          >
            <div>Sensor</div>
            <div style={{ color: '#e0e0e0' }}>
              {SENSORS.find((s) => s.id === active)?.name}
            </div>
            <div>Rate</div>
            <div style={{ color: '#e0e0e0' }}>
              {SENSORS.find((s) => s.id === active)?.rate}
            </div>
            <div>Accuracy</div>
            <div style={{ color: '#e0e0e0' }}>
              {SENSORS.find((s) => s.id === active)?.accuracy}
            </div>
            <div>Timestamp</div>
            <div style={{ color: 'var(--muted)' }}>
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuantumWearablesPage() {
  return (
    <>
      {/* Hero */}
      <HeroBanner
        kind="atom"
        title="Quantum Wearables"
        subtitle="Human Intelligence Amplified"
        badge="KDCI Flagship Division"
      />

      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(212,175,55,0.06), transparent 60%), #0a0a0f',
        }}
      >
        <Particles />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.3fr 1fr',
            gap: 20,
            alignItems: 'center',
            padding: 24,
            maxWidth: 1100,
            margin: '0 auto',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div style={{ position: 'relative', zIndex: 2 }}>
            <QuantumDevice />
          </div>
          <div style={{ padding: '8px 0 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <span
                className="glass-card-badge"
                style={{
                  background: 'rgba(212,175,55,0.16)',
                  color: '#d4af37',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                }}
              >
                Flagship Device
              </span>
              <h3 style={{ color: '#e0e0e0', margin: 0, fontSize: '1.3rem' }}>
                Quantum Band X1
              </h3>
            </div>
            <p
              style={{
                color: 'var(--muted)',
                margin: '6px 0 16px',
                fontSize: '0.92rem',
              }}
            >
              Cold-fission powered · 30-day battery · 512Hz ECG · Quantum core AI
            </p>
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <a
                className="btn-gold"
                href="/gaming/aura-champions"
                style={{
                  padding: '13px 34px',
                  borderRadius: 8,
                  backgroundColor: '#d4af37',
                  color: '#0a0a0f',
                  fontWeight: 700,
                  fontSize: '1.02rem',
                  textDecoration: 'none',
                }}
              >
                Pre-Order X1
              </a>
              <a
                href="/gaming/aura-champions"
                style={{
                  padding: '13px 34px',
                  borderRadius: 8,
                  border: '1px solid rgba(212,175,55,0.4)',
                  color: '#d4af37',
                  fontWeight: 600,
                  fontSize: '1.02rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                Explore Ecosystem <span style={{ fontSize: '1.1rem' }}>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <PageFrame
        title="Quantum Wearables"
        subtitle="Human Intelligence Amplified — Full-Spectrum Biosensing"
      >
        {/* Product ecosystem */}
        <SectionHeader
          title="The Quantum Ecosystem"
          subtitle="Intelligence wears many forms."
        />
        <div
          className="card-grid"
          style={{
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            marginTop: 12,
          }}
        >
          <ProductRow
            title="Quantum Band X1"
            tag="LIFESTYLE INTELLIGENCE"
            desc="Continuous monitoring. Extraordinary insight."
            ico="🎗️"
            color="Explore"
          />
          <ProductRow
            title="Neural Patch"
            tag="DIRECT NEURAL MONITORING"
            desc="Direct signal acquisition. Deeper into the nervous system."
            ico="🧠"
            color="Learn"
          />
          <ProductRow
            title="Nexus Gateway"
            tag="MESH COORDINATOR"
            desc="Synchronize. Process. Expand."
            ico="🔗"
            color="Connect"
          />
        </div>

        {/* Interactive sensor network */}
        <SectionHeader
          title="Sensor Network Visualization"
          subtitle="Hover a sensor to reveal live waveforms."
        />
        <SensorGrid />

        {/* Product comparison */}
        <SectionHeader
          title="Product Comparison Matrix"
          subtitle="Spec sheet at a glance."
        />
        <div
          style={{
            overflowX: 'auto',
            border: '1px solid rgba(212,175,55,0.15)',
            borderRadius: 10,
            background: 'rgba(212,175,55,0.03)',
          }}
        >
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: 520,
              color: '#e0e0e0',
            }}
          >
            <thead
              style={{
                background: 'rgba(212,175,55,0.1)',
                borderBottom: '1px solid rgba(212,175,55,0.2)',
                color: '#d4af37',
              }}
            >
              <tr>
                {[
                  'Feature',
                  'Quantum Band X1',
                  'Quantum Patch',
                  'Nexus Gateway',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 1.5,
                      fontSize: '0.82rem',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['ECG', '512 Hz', '1000 Hz', '—'],
                ['SpO₂', 'Yes · ±0.5%', 'Yes · ±0.3%', '—'],
                ['Temperature', 'Yes · ±0.1°C', 'Yes · ±0.1°C', '—'],
                ['Motion IMU', '6-axis', '6-axis', '8-axis'],
                ['AI Core', 'Lite', 'Advanced', 'Elite'],
                ['Battery', '30-Day', '5-Day', 'Per Device'],
                ['Status', 'Active', 'Active', 'Active'],
              ].map((row, ri) => (
                <tr
                  key={ri}
                  style={{
                    borderBottom: `1px solid rgba(255,255,255,0.06)`,
                    backgroundColor:
                      ri % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  }}
                >
                  {row.map((c, ci) => (
                    <td
                      key={ci}
                      style={{
                        padding: '12px 14px',
                        fontSize: '0.9rem',
                        color: '#e0e0e0',
                        borderBottom: 'none',
                      }}
                    >
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Intelligence pipeline */}
        <SectionHeader
          title="Quantum Intelligence Layer"
          subtitle="The full intelligence stack behind every signal."
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 14,
            padding: '20px 0 40px',
          }}
        >
          {[
            { label: 'Wearable', ico: '🎗️' },
            { label: 'Sensor Mesh', ico: '📡' },
            { label: 'AI Signal Layer', ico: '⚡' },
            { label: 'Quantum Engine', ico: '🔮' },
            { label: 'Human Insights', ico: '✨' },
          ].map((l, i) => (
            <div
              key={l.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: '1.5rem', color: 'var(--muted)' }}>
                {l.ico}
              </span>
              <span
                style={{
                  color: '#d4af37',
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                }}
              >
                {l.label}
              </span>
              {i < 4 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#d4af37',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    padding: '0 6px',
                  }}
                >
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>
      </PageFrame>
    </>
  );
}
