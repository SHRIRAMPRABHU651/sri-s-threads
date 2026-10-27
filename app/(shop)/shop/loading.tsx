export default function Loading() {
  return (
    <div className="shop" aria-busy="true" aria-label="Loading products">
      <div className="shop__tabs"><span className="skeleton" style={{ height: 36, width: 260 }} /></div>
      <div className="shop__layout">
        <aside className="shop__side"><div className="skeleton" style={{ height: 320 }} /></aside>
        <div className="shop__main">
          <div className="skeleton" style={{ height: 28, width: 180, marginBottom: 16 }} />
          <div className="product-grid product-grid--shop">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton skeleton--card" />)}</div>
        </div>
      </div>
    </div>
  );
}
