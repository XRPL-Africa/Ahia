import { Request, Response } from "express";
import * as listingService from "./listings.service";
import { createListingSchema } from "./listings.validation";

export const create = async (req: Request, res: Response) => {
  try {
    const validated = createListingSchema.parse(req.body);

    // TODO: replace with real auth user
    const userId = "mock-user-id";

    const listing = await listingService.createListing(validated, userId);

    res.status(201).json(listing);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const getAll = async (req: Request, res: Response) => {
  const listings = await listingService.getListings(req.query);
  res.json(listings);
};

export const update = async (req: Request, res: Response) => {
  const listing = await listingService.updateListing(
    req.params.id,
    req.body
  );
  res.json(listing);
};

export const remove = async (req: Request, res: Response) => {
  await listingService.deleteListing(req.params.id);
  res.json({ message: "Deleted successfully" });
};