export function AdminOnly() {
  return (
    <div className="panel empty-panel">
      <h2>Admins only</h2>
      <p className="muted">Your staff account can manage orders and stock. Ask the owner if you need more access.</p>
    </div>
  );
}
