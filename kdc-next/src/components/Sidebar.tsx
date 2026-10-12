'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PAGES = [
  { href: '/', label: 'Dashboard', ico: '◈' },
  { href: '/travel-index', label: 'Travel', ico: '🌍' },
  { href: '/shoe-brand', label: 'Shoes', ico: '👟' },
  { href: '/game-design', label: 'Games', ico: '🎮' },
  { href: '/kids-channel', label: 'Kids', ico: '📚' },
  { href: '/innovation-hub', label: 'Innovation', ico: '💡' },
  { href: '/ewaste-recycling', label: 'E-Waste', ico: '♻️' },
  { href: '/quantum-wearables', label: 'Quantum', ico: '⚛️' },
];

export default function Sidebar() {
  const pathname = usePathname() || '';

  return (
    <aside className="app-sidebar">
      <div className="brand-row">
        <div className="brand-title">KingDesignCollectiveINC</div>
        <span className="brand-badge">250</span>
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
