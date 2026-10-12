import React from 'react';
import HeroArt from './HeroArt';

// Themed hero banner for subsidiary pages — hero art + title + subtitle,
// matching the dashboard reference aesthetic. Used at the top of each page.
export default function HeroBanner({
  kind,
  title,
  subtitle,
  badge,
}: {
  kind: string;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <div className="hero-banner">
      <div className="hero-banner-art"><HeroArt kind={kind} /></div>
      <div className="hero-banner-text">
        <div className="hero-banner-title">{title}</div>
        <div className="hero-banner-sub">{subtitle}</div>
        {badge && <span className="hero-banner-badge">{badge}</span>}
      </div>
    </div>
  );
}
