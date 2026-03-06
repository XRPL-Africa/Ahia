import { z } from "zod";

export const createListingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  price: z.number().positive(),
  type: z.enum(["BUY_NOW", "BIDDING"]),
  campus: z.string().min(2),
  imageUrl: z.string().url().optional(),
});