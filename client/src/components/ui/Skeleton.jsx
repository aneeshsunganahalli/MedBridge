export default function Skeleton({ width, height, lines = 1, className = '' }) {
  if (lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton skeleton-line"
            style={{
              width: i === lines - 1 ? '60%' : '100%',
              height: height || '14px',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton ${className}`}
      style={{ width: width || '100%', height: height || '14px' }}
    />
  );
}

export function SkeletonCard({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" style={{ marginBottom: 10 }} />
      ))}
    </>
  );
}
