import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "./auth";

export const ownerCheck = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const listingId = req.params.id;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });

  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.ownerId !== req.userId) return res.status(403).json({ error: "Not authorized" });

  next();
};