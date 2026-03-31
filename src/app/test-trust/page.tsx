"use client";
import { TrustScoreDisplay } from "@/components/profile/TrustScore";

export default function TestTrust() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <TrustScoreDisplay
        score={4.2}
        breakdown={{
          trades:       { score: 4.5, count: 31 },
          responseTime: { score: 3.8, avgHours: 1.5 },
          ratings:      { score: 4.1, count: 18 },
        }}
        history={[
          { month: "Oct", score: 3.0 },
          { month: "Nov", score: 3.4 },
          { month: "Dec", score: 3.7 },
          { month: "Jan", score: 3.9 },
          { month: "Feb", score: 4.1 },
          { month: "Mar", score: 4.2 },
        ]}
      />
    </main>
  );
}
