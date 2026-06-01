import { Link } from "react-router";

export default function HomePage() {
  return (
    <div style={{ padding: "48px 32px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 800 }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 700 }}>Product Configurator</h1>
      <p style={{ margin: "0 0 40px", color: "#6b7280", fontSize: 16 }}>
        Let customers personalise your products with custom colors, text, and logos.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        <DashCard
          emoji="📦"
          title="Products"
          description="View your Shopify products and set up their configurators."
          href="/app/products"
          cta="Manage Products"
        />
        <DashCard
          emoji="🎨"
          title="Setup"
          description="Define layers, color swatches, text and logo options for each product."
          href="/app/products"
          cta="Go to Setup"
        />
        <DashCard
          emoji="🖼️"
          title="Preview"
          description="Open the live configurator and test the customisation experience."
          href="/app/products"
          cta="Open Configurator"
        />
      </div>

      <div style={{ marginTop: 48, padding: "20px 24px", background: "#f9fafb", borderRadius: 12, border: "1px solid #e5e7eb" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>Getting started</h3>
        <ol style={{ margin: 0, padding: "0 0 0 20px", color: "#374151", lineHeight: 1.8, fontSize: 14 }}>
          <li>Go to <Link to="/app/products" style={{ color: "#2563eb" }}>Products</Link> and find the product you want to customise.</li>
          <li>Click <strong>Set Up</strong> to define layers, color options, text, and logo settings.</li>
          <li>Click <strong>Open Configurator</strong> to preview the live customisation experience.</li>
        </ol>
      </div>
    </div>
  );
}

function DashCard({ emoji, title, description, href, cta }: { emoji: string; title: string; description: string; href: string; cta: string }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px 20px", background: "#fff", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 32 }}>{emoji}</div>
      <div>
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600 }}>{title}</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{description}</p>
      </div>
      <Link
        to={href}
        style={{ marginTop: "auto", padding: "9px 0", textAlign: "center", background: "#111827", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 500 }}
      >
        {cta}
      </Link>
    </div>
  );
}
