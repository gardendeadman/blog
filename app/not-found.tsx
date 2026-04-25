import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '6rem',
          fontWeight: 700,
          color: 'var(--accent)',
          lineHeight: 1,
          opacity: 0.3,
        }}
      >
        404
      </div>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 600,
          color: 'var(--text)',
        }}
      >
        Page Not Found
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
        The page you requested does not exist or has been removed.
      </p>
      <Link
        href="/"
        style={{
          marginTop: '8px',
          padding: '10px 24px',
          background: 'var(--accent)',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '0.925rem',
          fontWeight: 600,
        }}
      >
        Go to Home
      </Link>
    </div>
  );
}
