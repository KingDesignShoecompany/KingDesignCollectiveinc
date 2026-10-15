'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../hooks/useCart';

const PAGES = [
  { href: '/', label: 'Dashboard', ico: '◈' },
  { href: '/travel-index', label: 'Vagary Index', ico: '🌍' },
  { href: '/shoe-brand', label: 'KingDesignShoeCompany', ico: '👟' },
  { href: '/game-design', label: 'Aura Champions', ico: '🎮' },
  { href: '/kids-channel', label: 'Seven Minute Story Sessions', ico: '📚' },
  { href: '/innovation-hub', label: 'King Design Collective Briheight Box', ico: '💡' },
  { href: '/ewaste-recycling', label: 'KingDesign E-Collective', ico: '♻️' },
  { href: '/quantum-wearables', label: 'Quantum Mode', ico: '⚛️' },
];

export default function Sidebar() {
  const pathname = usePathname() || '';
  const { count } = useCart();

  return (
    <aside className="app-sidebar">
      <div className="brand-row">
        <div className="brand-title">KingDesignCollectiveINC</div>
        <span className="brand-badge">250</span>
        {count > 0 && (
          <Link href="/cart/" className="cart-pill" title={`${count} item${count === 1 ? '' : 's'} in cart`}>
            🛒 {count}
          </Link>
        )}
      </div>

      <div className="nav-section-title">Navigation</div>
      <nav className="nav-list">
        {PAGES.map((page) => {
          const active =
            page.href === '/'
              ? pathname === '/' || pathname === ''
              : pathname === page.href || pathname.startsWith(page.href + '/');
          return (
            <Link
              key={page.href}
              href={page.href}
              className={'nav-link' + (active ? ' nav-link-active' : '')}
            >
              <span className="nav-ico">{page.ico}</span>
              {page.label.toUpperCase()}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
