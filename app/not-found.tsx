import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div>
        <h1 style={{ font: "400 28px/36px Cinzel, Georgia, serif", color: "#092b2b", margin: "0 0 8px" }}>Page not found</h1>
        <p style={{ color: "#525252", fontSize: 14, margin: "0 0 18px" }}>The page you’re looking for doesn’t exist or has moved.</p>
        <Link href="/" className="btn btn--primary">Back to home</Link>
      </div>
    </div>
  );
}
