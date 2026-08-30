"use client";

/**
 * Global error boundary — renders when the root layout itself throws.
 * Keeps the office brand palette and offers a recovery action.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#00150d",
          color: "#f9f5e6",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            حدث خطأ غير متوقع
          </h1>
          <p style={{ color: "rgba(249,245,230,0.7)", marginBottom: "1.5rem" }}>
            Something went wrong. / حدث خطأ ما — حاول مرة أخرى.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#e9c260",
              color: "#00150d",
              border: "none",
              borderRadius: "999px",
              padding: "12px 28px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            إعادة المحاولة / Retry
          </button>
          {error.digest ? (
            <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "rgba(249,245,230,0.4)" }} dir="ltr">
              {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
