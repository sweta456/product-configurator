import { Link } from "react-router";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Banner,
  Box,
  Icon,
  Divider,
} from "@shopify/polaris";
import {
  ProductIcon,
  PaintBrushFlatIcon,
  ViewIcon,
  ChevronRightIcon,
  StarFilledIcon,
} from "@shopify/polaris-icons";

export default function HomePage() {
  return (
    <Page
      title="Product Configurator"
      subtitle="Let customers personalise your products with custom colors, text & logos"
    >
      <BlockStack gap="600">
        {/* Feature Cards */}
        <Layout>
          <Layout.Section variant="oneThird">
            <FeatureCard
              icon={ProductIcon}
              iconTone="base"
              accentColor="#4f46e5"
              title="Products"
              description="View all your configured products and manage their publish status from one central place."
              href="/app/products"
              cta="Manage Products"
            />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <FeatureCard
              icon={PaintBrushFlatIcon}
              iconTone="base"
              accentColor="#0891b2"
              title="Setup Builder"
              description="Define layers, color swatches, text inputs and logo upload options for each product."
              href="/app/products"
              cta="Go to Setup"
            />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <FeatureCard
              icon={ViewIcon}
              iconTone="base"
              accentColor="#059669"
              title="Live Preview"
              description="Open the live configurator and test the customisation experience your customers will see."
              href="/app/products"
              cta="Open Preview"
            />
          </Layout.Section>
        </Layout>

        {/* Getting Started */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <InlineStack gap="200" blockAlign="center">
                <Box background="bg-fill-magic" borderRadius="200" padding="150">
                  <Icon source={StarFilledIcon} tone="magic" />
                </Box>
                <Text variant="headingMd" as="h2">Getting Started</Text>
              </InlineStack>
            </InlineStack>
            <Divider />
            <BlockStack gap="300">
              <StepRow
                number={1}
                title="Add a Product"
                description={
                  <>
                    Go to <Link to="/app/products" style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>Products</Link> and select the product you want to customise.
                  </>
                }
              />
              <StepRow
                number={2}
                title="Build the Configurator"
                description="Click Set Up to define layers, color swatches, text, and logo placement on the canvas."
              />
              <StepRow
                number={3}
                title="Publish & Preview"
                description="Click Publish to make it live, then Open Configurator to test the full customer experience."
              />
            </BlockStack>
            <Box paddingBlockStart="200">
              <Link to="/app/products" style={{ textDecoration: "none" }}>
                <Button variant="primary" icon={ChevronRightIcon}>Get Started</Button>
              </Link>
            </Box>
          </BlockStack>
        </Card>

        {/* What's Possible */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingMd" as="h2">What you can configure</Text>
              <Link to="/app/settings" style={{ textDecoration: "none" }}>
                <Button variant="plain">Global Settings →</Button>
              </Link>
            </InlineStack>
            <Divider />
            <Layout>
              {[
                { emoji: "🎨", label: "Color Swatches", desc: "Let customers pick colors from predefined swatches or full color pickers.", href: "/app/settings" },
                { emoji: "✏️", label: "Custom Text", desc: "Add personalised text with font, size, and color controls.", href: "/app/products" },
                { emoji: "🖼️", label: "Logo Upload", desc: "Allow customers to upload their own logo or artwork.", href: "/app/products" },
                { emoji: "🧩", label: "Layer System", desc: "Stack multiple product layers and apply colorization effects per layer.", href: "/app/products" },
                { emoji: "🔀", label: "Conditional Logic", desc: "Show or hide options based on previous selections.", href: "/app/products" },
                { emoji: "📦", label: "Multi-View", desc: "Support front, back, and side views on the same product.", href: "/app/products" },
              ].map(({ emoji, label, desc, href }) => (
                <Layout.Section key={label} variant="oneThird">
                  <Link to={href} style={{ textDecoration: "none" }}>
                    <Box
                      background="bg-surface-secondary"
                      borderRadius="200"
                      padding="400"
                    >
                      <div style={{ cursor: "pointer" }}>
                        <BlockStack gap="200">
                          <Text variant="headingLg" as="p">{emoji}</Text>
                          <Text variant="headingSm" as="h3">{label}</Text>
                          <Text variant="bodySm" tone="subdued" as="p">{desc}</Text>
                        </BlockStack>
                      </div>
                    </Box>
                  </Link>
                </Layout.Section>
              ))}
            </Layout>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}

function FeatureCard({ icon, accentColor, title, description, href, cta }: {
  icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  iconTone?: string;
  accentColor: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Card>
      <BlockStack gap="400">
        <Box
          background="bg-surface-secondary"
          borderRadius="300"
          padding="400"
          borderStartStartRadius="300"
          borderStartEndRadius="300"
        >
          <BlockStack gap="300">
            <div style={{ width: 44, height: 44, borderRadius: 8, background: `${accentColor}18`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon source={icon} />
            </div>
            <Text variant="headingMd" as="h3">{title}</Text>
            <Text variant="bodySm" tone="subdued" as="p">{description}</Text>
          </BlockStack>
        </Box>
        <Box paddingInlineStart="400" paddingInlineEnd="400" paddingBlockEnd="400">
          <Link to={href} style={{ textDecoration: "none" }}>
            <Button variant="secondary" fullWidth>{cta}</Button>
          </Link>
        </Box>
      </BlockStack>
    </Card>
  );
}

function StepRow({ number, title, description }: { number: number; title: string; description: React.ReactNode }) {
  return (
    <InlineStack gap="400" blockAlign="start" wrap={false}>
      <Box
        background="bg-fill-brand"
        borderRadius="full"
        minWidth="28px"
        minHeight="28px"
        width="28px"
      >
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Text variant="bodySm" fontWeight="bold" as="span" tone="text-inverse">{number}</Text>
        </div>
      </Box>
      <BlockStack gap="050">
        <Text variant="bodyMd" fontWeight="semibold" as="p">{title}</Text>
        <Text variant="bodySm" tone="subdued" as="p">{description}</Text>
      </BlockStack>
    </InlineStack>
  );
}
