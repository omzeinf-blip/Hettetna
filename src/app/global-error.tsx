"use client";

/** Last-resort boundary for errors in the root layout itself. Uses inline styles: CSS may not have loaded. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#153d32",
          color: "#f7f4ec",
          fontFamily: "Segoe UI, Tahoma, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>نعتذر، حدث خطأ غير متوقع</h1>
          <p style={{ opacity: 0.85, lineHeight: 1.8 }}>يرجى إعادة المحاولة، وإن استمرت المشكلة فتواصل معنا لاحقًا.</p>
          <button
            type="button"
            onClick={reset}
            style={{ background: "#b99a5b", color: "#0d2a23", border: 0, padding: "10px 22px", fontSize: 15, cursor: "pointer" }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
