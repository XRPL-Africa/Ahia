import { z } from 'zod';

const campusError = 'Please select a valid campus';
const conditionError = 'Please select a valid condition';

export const LoginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
});

export const SignUpSchema = z
  .object({
    name: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    campus_id: z.string().min(1, campusError).refine(
      (v) => ['UNIBEN', 'UNILAG', 'UI', 'UNN', 'FUNAAB', 'LASU', 'OAU', 'FUTA'].includes(v), campusError
    ),
    student_id: z.string().min(1, 'Student ID is required').min(5, 'Please enter a valid student ID'),
    termsAccepted: z.boolean().refine((v) => v === true, { message: 'You must accept the terms and conditions' }),
  })
  .refine((data) => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const ListingSchema = z.object({
  title: z.string().min(1, 'Title is required').min(10, 'Title must be at least 10 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').min(20, 'Description must be at least 20 characters').max(500, 'Description must be less than 500 characters'),
  price: z.number().positive('Price must be greater than 0').max(100000000, 'Price seems too high'),
  category: z.string().min(1, 'Please select a category'),
  condition: z.string().min(1, conditionError).refine((v) => ['new', 'used', 'refurbished'].includes(v), conditionError),
  campus_id: z.string().min(1, campusError).refine(
    (v) => ['UNIBEN', 'UNILAG', 'UI', 'UNN', 'FUNAAB', 'LASU', 'OAU', 'FUTA'].includes(v), campusError
  ),
  is_bidding: z.boolean().optional().default(false),
  starting_bid: z.number().positive().optional(),
  bid_end_date: z.string().optional(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters').optional(),
  bio: z.string().max(300, 'Bio must be less than 300 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

export const ChatMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message must be less than 1000 characters'),
  type: z.enum(['text', 'image']).default('text'),
  image_url: z.string().url('Invalid image URL').optional(),
});

export const CreateRatingSchema = z.object({
  transaction_id: z.string().min(1, 'Transaction ID is required'),
  reviewee_id: z.string().min(1, 'Reviewee ID is required'),
  score: z.number().int('Score must be a whole number').min(1, 'Score must be between 1 and 5').max(5, 'Score must be between 1 and 5'),
  comment: z.string().min(1, 'Review comment is required').min(10, 'Comment must be at least 10 characters').max(500, 'Comment must be less than 500 characters'),
});

export const CreateTransactionSchema = z.object({
  listing_id: z.string().min(1, 'Listing ID is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().refine((v) => ['NGN', 'RLUSD'].includes(v), 'Please select a valid currency'),
  payment_method: z.string().refine((v) => ['card', 'wallet', 'rlusd'].includes(v), 'Please select a valid payment method'),
});

export const DisputeSchema = z.object({
  reason: z.string().min(1, 'Reason is required').min(20, 'Please provide more detail (at least 20 characters)').max(1000, 'Reason must be less than 1000 characters'),
});

export const FileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'Please select a file' })
    .refine((f) => f.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine((f) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type), 'Only JPG, PNG, and WEBP files are allowed'),
});

export const MultiFileUploadSchema = z.object({
  files: z.array(z.instanceof(File))
    .min(1, 'At least 1 image is required')
    .max(5, 'Maximum 5 images allowed')
    .refine((files) => files.every((f) => f.size <= 5 * 1024 * 1024), 'Each image must be less than 5MB')
    .refine((files) => files.every((f) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type)), 'Only JPG, PNG, and WEBP images are allowed'),
});

export const ResolveDisputeSchema = z.object({
  resolution: z.string().refine((v) => ['refunded', 'released', 'split'].includes(v), 'Please select a resolution type'),
  admin_notes: z.string().min(1, 'Admin notes are required').min(10, 'Please provide more detail in your notes'),
  split_percentage: z.number().min(0).max(100).optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

export const SearchSchema = z.object({
  query: z.string().optional(),
  campus_id: z.string().optional(),
  category: z.string().optional(),
  condition: z.string().optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().positive().optional(),
  sort_by: z.enum(['price_asc', 'price_desc', 'date_newest', 'rating']).optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type ListingInput = z.infer<typeof ListingSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type CreateRatingInput = z.infer<typeof CreateRatingSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type DisputeInput = z.infer<typeof DisputeSchema>;
export type ResolveDisputeInput = z.infer<typeof ResolveDisputeSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;
