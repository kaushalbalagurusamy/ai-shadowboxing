import "./globals.css";

export const metadata = {
  title: "AI Shadowboxing",
  description: "Phase 1 - The Demo Sparring Session",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
