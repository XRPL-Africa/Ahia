import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phoneNumber: z.ZodOptional<z.ZodString>;
    campusId: z.ZodString;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, z.core.$strip>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export declare const updateProfileSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    phoneNumber: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const verificationSubmitSchema: z.ZodObject<{
    studentIdNumber: z.ZodString;
    portalScreenshotUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const verificationReviewSchema: z.ZodObject<{
    status: z.ZodEnum<{
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
    }>;
    rejectionReason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const listingConditionEnum: z.ZodEnum<{
    new: "new";
    like_new: "like_new";
    good: "good";
    fair: "fair";
    poor: "poor";
}>;
export declare const listingTypeEnum: z.ZodEnum<{
    BUY_NOW: "BUY_NOW";
    OPEN_BID: "OPEN_BID";
}>;
export declare const listingCategoryEnum: z.ZodEnum<{
    electronics: "electronics";
    fashion: "fashion";
    books: "books";
    furniture: "furniture";
    sports: "sports";
    beauty: "beauty";
    food: "food";
    services: "services";
    others: "others";
}>;
export declare const createListingSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<{
        electronics: "electronics";
        fashion: "fashion";
        books: "books";
        furniture: "furniture";
        sports: "sports";
        beauty: "beauty";
        food: "food";
        services: "services";
        others: "others";
    }>;
    condition: z.ZodEnum<{
        new: "new";
        like_new: "like_new";
        good: "good";
        fair: "fair";
        poor: "poor";
    }>;
    listingType: z.ZodEnum<{
        BUY_NOW: "BUY_NOW";
        OPEN_BID: "OPEN_BID";
    }>;
    buyNowPrice: z.ZodOptional<z.ZodNumber>;
    startingBid: z.ZodOptional<z.ZodNumber>;
    reservePrice: z.ZodOptional<z.ZodNumber>;
    swapSpotId: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateListingSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<{
        electronics: "electronics";
        fashion: "fashion";
        books: "books";
        furniture: "furniture";
        sports: "sports";
        beauty: "beauty";
        food: "food";
        services: "services";
        others: "others";
    }>>;
    condition: z.ZodOptional<z.ZodEnum<{
        new: "new";
        like_new: "like_new";
        good: "good";
        fair: "fair";
        poor: "poor";
    }>>;
    buyNowPrice: z.ZodOptional<z.ZodNumber>;
    startingBid: z.ZodOptional<z.ZodNumber>;
    reservePrice: z.ZodOptional<z.ZodNumber>;
    swapSpotId: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const listingFiltersSchema: z.ZodObject<{
    campusId: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<{
        electronics: "electronics";
        fashion: "fashion";
        books: "books";
        furniture: "furniture";
        sports: "sports";
        beauty: "beauty";
        food: "food";
        services: "services";
        others: "others";
    }>>;
    condition: z.ZodOptional<z.ZodEnum<{
        new: "new";
        like_new: "like_new";
        good: "good";
        fair: "fair";
        poor: "poor";
    }>>;
    listingType: z.ZodOptional<z.ZodEnum<{
        BUY_NOW: "BUY_NOW";
        OPEN_BID: "OPEN_BID";
    }>>;
    minPrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    maxPrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    sellerId: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        viewCount: "viewCount";
        price: "price";
    }>>;
    sortOrder: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>;
export declare const createBidSchema: z.ZodObject<{
    listingId: z.ZodString;
    amount: z.ZodNumber;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const counterBidSchema: z.ZodObject<{
    counterAmount: z.ZodNumber;
    counterMessage: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const bidResponseSchema: z.ZodObject<{
    action: z.ZodEnum<{
        ACCEPT: "ACCEPT";
        REJECT: "REJECT";
    }>;
}, z.core.$strip>;
export declare const createEscrowSchema: z.ZodObject<{
    listingId: z.ZodString;
    bidId: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodEnum<{
        FIAT_PAYSTACK: "FIAT_PAYSTACK";
        CRYPTO_RLUSD: "CRYPTO_RLUSD";
    }>;
}, z.core.$strip>;
export declare const escrowActionSchema: z.ZodObject<{
    action: z.ZodEnum<{
        MARK_HANDOVER: "MARK_HANDOVER";
        VERIFY: "VERIFY";
        FREEZE: "FREEZE";
        DISPUTE: "DISPUTE";
        CANCEL: "CANCEL";
    }>;
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const freezeEscrowSchema: z.ZodObject<{
    reason: z.ZodString;
}, z.core.$strip>;
export declare const createDisputeSchema: z.ZodObject<{
    escrowId: z.ZodString;
    reason: z.ZodString;
    description: z.ZodString;
}, z.core.$strip>;
export declare const resolveDisputeSchema: z.ZodObject<{
    resolution: z.ZodEnum<{
        RESOLVED_BUYER: "RESOLVED_BUYER";
        RESOLVED_SELLER: "RESOLVED_SELLER";
    }>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const initiatePaymentSchema: z.ZodObject<{
    escrowId: z.ZodString;
}, z.core.$strip>;
export declare const offrampSchema: z.ZodObject<{
    amount: z.ZodNumber;
    bankName: z.ZodString;
    accountNumber: z.ZodString;
    accountName: z.ZodString;
}, z.core.$strip>;
export declare const createReviewSchema: z.ZodObject<{
    revieweeId: z.ZodString;
    rating: z.ZodNumber;
    comment: z.ZodOptional<z.ZodString>;
    tradeId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createCampusSchema: z.ZodObject<{
    name: z.ZodString;
    subdomain: z.ZodString;
    slug: z.ZodString;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    primaryColor: z.ZodOptional<z.ZodString>;
    secondaryColor: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createSwapSpotSchema: z.ZodObject<{
    campusId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    location: z.ZodString;
    coordinates: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const adminActionSchema: z.ZodObject<{
    userId: z.ZodString;
    action: z.ZodEnum<{
        SUSPEND: "SUSPEND";
        BAN: "BAN";
        UNBAN: "UNBAN";
        RESET_STRIKES: "RESET_STRIKES";
    }>;
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const uuidParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type CreateBidInput = z.infer<typeof createBidSchema>;
export type CreateEscrowInput = z.infer<typeof createEscrowSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type OfframpInput = z.infer<typeof offrampSchema>;
//# sourceMappingURL=index.d.ts.map