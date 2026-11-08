'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectAuraChampions() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/gaming/aura-champions');
  }, [router]);

  return <div className="page-frame" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: '#d4af37', fontSize: '2rem' }}>🎮</div>
      <h1 style={{ color: '#e0e0e0', marginTop: 12 }}>KDCI Gaming</h1>
      <p style={{ color: '#9ca3af', margin: '8px 0 16px' }}>Aura Champions has moved to the new division.</p>
      <a href="/gaming/aura-champions" className="btn-gold">Go to Aura Champions</a>
    </div>
  </div>;
}
