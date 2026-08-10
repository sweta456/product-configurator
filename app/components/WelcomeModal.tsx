export default function WelcomeModal({
  open,
  onClose,
  videoUrl,
}: {
  open: boolean;
  onClose: () => void;
  videoUrl: string | null;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 14, width: 460,
          maxWidth: "90vw", boxShadow: "0 24px 60px rgba(0,0,0,0.24)",
          overflow: "hidden",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid #e3e3e3",
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1d23" }}>Welcome to Konfig</span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6d7175", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6d7175", lineHeight: 1.55 }}>
            Here's a quick look at what you can do.
          </p>

          {videoUrl ? (
            <div style={{ aspectRatio: "16 / 9", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
              <iframe
                src={videoUrl}
                title="Welcome to Konfig"
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div style={{
              aspectRatio: "16 / 9", borderRadius: 10,
              background: "linear-gradient(155deg, #f1f2fb 0%, #e6e8fb 100%)",
              border: "1px dashed #c7cbf5",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, marginBottom: 18,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", background: "#4f46e5",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 0, height: 0, marginLeft: 3,
                  borderTop: "7px solid transparent", borderBottom: "7px solid transparent",
                  borderLeft: "11px solid #fff",
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6355e8" }}>Demo video coming soon</span>
            </div>
          )}
        </div>

        <div style={{ padding: "0 20px 20px" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", background: "#4f46e5", color: "#fff", border: "none",
              borderRadius: 9, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
