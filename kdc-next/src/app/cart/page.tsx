'use client';

import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import HeroBanner from '../../components/HeroBanner';
import { useCart } from '../../hooks/useCart';
import { PRODUCTS, type Product } from '../../data/shoes';

export default function CartPage() {
  const { items, clear, count } = useCart();
  const byId = new Map<string, Product>(PRODUCTS.map((p) => [p.id, p]));
  const total = items.reduce((sum, i) => sum + (byId.get(i.sku)?.price ?? 0) * i.qty, 0);

  return (
    <>
      <HeroBanner kind="shoe" title="Cart" subtitle="Demo cart — review and check out" badge={`${count} item${count === 1 ? '' : 's'}`} />
      <PageFrame title="Your Cart" subtitle="Demo cart — no real payment gateway">
        {items.length === 0 ? (
          <div className="paywall">
            <div className="lock-ico">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Browse the catalog and add a silhouette to get started.</p>
            <Link href="/products/" className="btn-gold">Browse catalog</Link>
          </div>
        ) : (
          <>
            <div className="cart-list">
              {items.map((i) => {
                const p = byId.get(i.sku);
                return (
                  <div key={`${i.sku}-${i.size}`} className="cart-row">
                    <div className="cart-name">{p?.name ?? i.sku}</div>
                    <div className="cart-meta">Size {i.size} · Qty {i.qty}</div>
                    <div className="cart-price">${((p?.price ?? 0) * i.qty).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
            <div className="cart-total">
              <span>Subtotal</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            <div className="filter-row" style={{ marginTop: 16 }}>
              <button className="btn-gold" disabled>Checkout — demo only</button>
              <button className="btn-outline" onClick={clear}>Clear cart</button>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '.8rem', marginTop: 12 }}>
              This is a demo cart stored locally in your browser. No payment is processed.
            </p>
          </>
        )}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/products/" className="btn-outline">← Back to catalog</Link>
        </div>
      </PageFrame>
    </>
  );
}
