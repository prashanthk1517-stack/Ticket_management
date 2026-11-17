export function ErrorFallback({ onReload }: { onReload: () => void }) {
  return (
    <main className="monitor-error-fallback" role="alert">
      <p className="eyebrow">APPLICATION ERROR</p>
      <h1>This page ran into a problem</h1>
      <p>We recorded a safe diagnostic event. Reload the page to try again.</p>
      <button className="button button--primary" type="button" onClick={onReload}>
        Reload application
      </button>
    </main>
  );
}
