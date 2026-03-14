import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      {/* Brand Section */}
      <div className="mb-8 space-y-4">
        <h1 className="text-6xl font-heading font-bold bg-ahia-grad bg-clip-text text-transparent">
          Ahia Project Scaffolding
        </h1>
        <p className="text-ahia-text/60 max-w-md mx-auto text-lg">
          V1.0 • React Native | Next.js | RLUSD Escrow
        </p>
      </div>

      {/* Developer Call to Action */}
      <div className="bg-card border border-gray-200 p-8 rounded-ahia-lg shadow-ahia max-w-lg">
        <h2 className="text-2xl font-heading font-semibold mb-4">
          Internal Dev Suite
        </h2>
        <p className="text-gray-500 mb-6">
          Access the Design System, component library, and API documentation for
          the campus marketplace.
        </p>

        <Link
          href="/dev-guide"
          className="inline-block w-full py-4 px-8 bg-ahia-grad text-white font-bold rounded-ahia shadow-ahia hover:opacity-90 transition-opacity"
        >
          Enter Developer Guide
        </Link>
      </div>

      <footer className="absolute bottom-8 text-sm text-gray-400">
        Built for the RLUSD/XRPL Ecosystem • 2026
      </footer>
    </main>
  );
}
