import prisma from "../../config/prisma";

export const createListing = async (data: any, userId: string) => {
  return prisma.listing.create({
    data: {
      ...data,
      ownerId: userId,
    },
  });
};

export const getListings = async (filters: any) => {
  const { campus, type } = filters;

  return prisma.listing.findMany({
    where: {
      campus: campus || undefined,
      type: type || undefined,
    },
    include: {
      owner: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const updateListing = async (id: string, data: any) => {
  return prisma.listing.update({
    where: { id },
    data,
  });
};

export const deleteListing = async (id: string) => {
  return prisma.listing.delete({
    where: { id },
  });
};