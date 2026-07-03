export default function NotFound() {
  return (
    <section className="section" style={{ display: "grid", justifyItems: "center", gap: "0.9rem", textAlign: "center" }}>
      <h1
        style={{
          margin: 0,
          color: "var(--ink)",
          fontFamily: "var(--font-noto-serif-kr), 'Noto Serif KR', serif",
          fontSize: "clamp(2rem, 4.5vw, 3rem)",
          fontWeight: 700,
          letterSpacing: "-0.05em",
        }}
      >
        페이지를 찾을 수 없습니다
      </h1>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: "1.05rem", lineHeight: 1.8 }}>
        요청하신 주소가 없거나 변경되었을 수 있습니다
      </p>
    </section>
  );
}
