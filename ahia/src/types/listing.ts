export interface Seller {
  id: string;
  name: string;
  avatar: string;
  trust_score: number;
  campus: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  condition: "New" | "Used";
  seller: Seller;
  campus_id: string;
  created_at: string;
  is_sold: boolean;
}

export interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export const CATEGORIES = [
  "All",
  "Electronics",
  "Books",
  "Clothing",
  "Furniture",
  "Services",
  "Food",
  "Accessories",
  "Stationery",
] as const;

export type Category = (typeof CATEGORIES)[number];
