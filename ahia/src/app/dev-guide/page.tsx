import { IDUploader } from "@/components/auth/IDUploader";
import { MarketSearch } from "@/components/market/MarketSearch";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ui/ProductCard";
import { StatusTimeline } from "@/components/ui/StatusTimeline";
import { Lock, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react"; // Suggested icon set

export default function DevGuide() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="max-w-5xl mx-auto p-10 space-y-16">
        <header className="space-y-2 border-b border-gray-100 pb-8">
          <h1 className="text-5xl font-heading font-bold text-ahia-sunset">
            Dev Guide
          </h1>
          <p className="text-lg text-foreground/60 tracking-tight">
            Ahia Component Library & Branding V1.0
          </p>
        </header>

        {/* --- BUTTONS SECTION --- */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-ahia-sunset rounded-full" />
            <h2 className="text-2xl font-heading font-bold">Button System</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card p-8 rounded-ahia-lg border border-gray-100 shadow-sm">
            {/* Primary */}
            <div className="space-y-3">
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                Primary / Action
              </p>
              <Button variant="primary" className="w-full">
                Verify Authenticity <CheckCircle size={18} />
              </Button>
              <p className="text-xs text-gray-400 italic font-sans">
                Used for finality and payments.
              </p>
            </div>

            {/* Secondary */}
            <div className="space-y-3">
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                Secondary / Outline
              </p>
              <Button variant="secondary" className="w-full">
                Place a Bid <ArrowRight size={18} />
              </Button>
              <p className="text-xs text-gray-400 italic font-sans">
                Used for P2P interactions.
              </p>
            </div>

            {/* Danger */}
            <div className="space-y-3">
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                Danger / System
              </p>
              <Button variant="danger" className="w-full">
                Freeze Escrow <Lock size={18} />
              </Button>
              <p className="text-xs text-gray-400 italic font-sans">
                Used for disputes and stops.
              </p>
            </div>

            {/* Ghost */}
            <div className="space-y-3">
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                Ghost / Nav
              </p>
              <Button variant="ghost" className="w-full">
                View History
              </Button>
              <p className="text-xs text-gray-400 italic font-sans">
                Used for low-priority navigation.
              </p>
            </div>
          </div>
        </section>

        {/* --- COLORS SECTION --- */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-ahia-trust rounded-full" />
            <h2 className="text-2xl font-heading font-bold">Core Swatches</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <ColorSwatch hex="#FF7A00" label="Sunset" token="--ahia-sunset" />
            <ColorSwatch hex="#FF4B4B" label="Radiant Red" token="--ahia-red" />
            <ColorSwatch
              hex="#0062FF"
              label="Trust Blue"
              token="--ahia-trust"
            />
            <ColorSwatch hex="#00C853" label="Success" token="--ahia-success" />
            <ColorSwatch hex="#1A1A1B" label="Deep Navy" token="--ahia-text" />
          </div>
        </section>

        {/* --- MARKETPLACE CARDS --- */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-ahia-gold rounded-full" />
            <h2 className="text-2xl font-heading font-bold">
              Product Card Variants
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* State 1: Standard Listing */}
            <ProductCard
              title="MacBook Pro M1 - 16GB/512GB"
              price="₦850,000"
              sellerRating={4.9}
              location="UNILAG - New Hall"
              category="GIZMOS"
              imageUrl="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400&auto=format&fit=crop"
            />

            {/* State 2: No Escrow (Rare case) */}
            <ProductCard
              title="Calculus for Engineers (Textbook)"
              price="₦12,000"
              sellerRating={4.2}
              location="UNIBEN - Faculty of Eng"
              category="BOOKS"
              isEscrowProtected={false}
              imageUrl="https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop"
            />

            {/* State 3: Desktop View Placeholder */}
            <div className="bg-gray-50 rounded-ahia-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center space-y-2">
              <p className="text-gray-400 font-bold">New Component</p>
              <p className="text-xs text-gray-400">
                Add to /components/ui/ to see it here.
              </p>
            </div>
          </div>
        </section>

        {/* --- ESCROW STATUS TRACKER --- */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-ahia-trust rounded-full" />
            <h2 className="text-2xl font-heading font-bold">
              The Safety-Lock Engine
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* State: Testing Phase */}
            <div className="space-y-3">
              <p className="text-xs font-mono text-gray-400 uppercase">
                State: Testing (Day 4 of 14)
              </p>
              <StatusTimeline currentState="INSPECTION" daysRemaining={10} />
            </div>

            {/* State: Initial Deposit */}
            <div className="space-y-3">
              <p className="text-xs font-mono text-gray-400 uppercase">
                State: Committed (Funds Secured)
              </p>
              <StatusTimeline currentState="COMMITTED" daysRemaining={14} />
            </div>
          </div>
        </section>
        {/* --- VERIFICATION SECTION --- */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-ahia-red rounded-full" />
            <h2 className="text-2xl font-heading font-bold">
              User Onboarding (KYC)
            </h2>
          </div>

          <div className="flex justify-center py-10 bg-gray-50 rounded-ahia-lg border border-gray-100">
            <IDUploader />
          </div>
        </section>
        {/* --- SEARCH & NAVIGATION --- */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-ahia-sunset rounded-full" />
            <h2 className="text-2xl font-heading font-bold">
              Search & Navigation
            </h2>
          </div>

          <div className="p-8 bg-gray-50 rounded-ahia-lg border border-gray-100">
            <MarketSearch />
          </div>
        </section>
      </div>
    </div>
  );
}

function ColorSwatch({
  hex,
  label,
  token,
}: {
  hex: string;
  label: string;
  token: string;
}) {
  return (
    <div className="group cursor-help">
      <div
        className="h-20 w-full rounded-ahia shadow-inner border border-black/5 mb-2"
        style={{ backgroundColor: hex }}
      />
      <p className="text-sm font-bold font-heading">{label}</p>
      <p className="text-[10px] font-mono text-gray-400 group-hover:text-ahia-trust transition-colors">
        {token}
      </p>
    </div>
  );
}
