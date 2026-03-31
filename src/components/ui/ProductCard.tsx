import React from 'react';

interface ProductCardProps {
  title: string;
  price: string;
  sellerRating: number;
  location: string;
  category: string;
  imageUrl: string;
  isEscrowProtected?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  title,
  price,
  sellerRating,
  location,
  category,
  imageUrl,
  isEscrowProtected = true,
}) => {
  return (
    <div className="bg-card rounded-ahia-lg border border-gray-100 shadow-sm overflow-hidden">
      <img src={imageUrl} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-ahia-sunset font-bold text-xl">{price}</p>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>⭐ {sellerRating}</span>
          <span>{location}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest font-mono text-gray-400">{category}</span>
          {isEscrowProtected && <span className="text-xs bg-ahia-trust text-white px-2 py-1 rounded">Escrow Protected</span>}
        </div>
      </div>
    </div>
  );
};

export { ProductCard };