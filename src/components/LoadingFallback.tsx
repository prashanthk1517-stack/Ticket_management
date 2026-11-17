interface LoadingFallbackProps {
  className?: string;
  message?: string;
}

export function LoadingFallback({
  className = 'route-loading',
  message = 'Loading page…',
}: LoadingFallbackProps) {
  return (
    <div className={className} role="status" aria-busy="true">
      {message}
    </div>
  );
}
