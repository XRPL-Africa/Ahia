import { Lock, Star, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "./Button";

interface ProductCardProps {
  title: string;
  price: string;
  sellerRating: number;
  location: string;
  imageUrl: string;
  isEscrowProtected?: boolean;
  isVerifiedSeller?: boolean;
  category: string;
}

export const ProductCard = ({
  title,
  price,
  sellerRating,
  location,
  imageUrl,
  isEscrowProtected = true,
  isVerifiedSeller = true,
  category,
}: ProductCardProps) => {
  return (
    <div className="group relative bg-card rounded-ahia-lg border border-gray-100 shadow-ahia overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 hover:border-ahia-sunset/20">
      {/* Image & Badges */}
      <div className="relative h-52 w-full overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Floating Category Tag */}
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
          {category}
        </div>

        {/* Safety-Lock Badge */}
        {isEscrowProtected && (
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-ahia shadow-sm flex items-center gap-1.5 border border-ahia-trust/10">
            <Lock size={12} className="text-ahia-trust" />
            <span className="text-[10px] font-bold text-ahia-trust uppercase">
              Safety-Lock
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            {isVerifiedSeller && (
              <ShieldCheck size={14} className="text-ahia-success" />
            )}
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Verified Student
            </span>
          </div>
          <h3 className="font-heading font-bold text-lg text-ahia-text line-clamp-1">
            {title}
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-ahia-sunset">{price}</span>
          <div className="flex items-center gap-1 bg-ahia-gold/10 px-2 py-0.5 rounded-full">
            <Star size={12} className="text-ahia-gold fill-ahia-gold" />
            <span className="text-xs font-bold text-ahia-gold">
              {sellerRating}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-xs border-t border-gray-50 pt-3">
          <MapPin size={14} className="text-gray-400" />
          <span className="truncate">{location}</span>
        </div>

        <Button
          variant="secondary"
          className="w-full py-2.5 text-sm mt-1 group-hover:bg-ahia-sunset group-hover:text-white transition-colors"
        >
          View Deal
        </Button>
      </div>
    </div>
  );
};
