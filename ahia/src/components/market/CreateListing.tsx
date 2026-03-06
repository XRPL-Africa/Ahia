"use client";

import { useState, useRef, useCallback } from "react";
import { FiArrowLeft, FiCamera, FiX, FiCheck } from "react-icons/fi";
import { CATEGORIES } from "@/src/types/listing";
import { createListing } from "@/src/services/listing.service";

interface CreateListingProps {
  onBack: () => void;
  onSuccess: () => void;
}

const MAX_IMAGES = 5;
const CONDITION_OPTIONS: ("New" | "Used")[] = ["New", "Used"];
const FORM_CATEGORIES = CATEGORIES.filter((c) => c !== "All");

interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
  category?: string;
  images?: string;
}

export default function CreateListing({ onBack, onSuccess }: CreateListingProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<"New" | "Used">("Used");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
    if (!title.trim()) errs.title = "Title is required";
    else if (title.trim().length < 3) errs.title = "Title must be at least 3 characters";

    if (!description.trim()) errs.description = "Description is required";
    else if (description.trim().length < 10) errs.description = "At least 10 characters";

    const numericPrice = Number(price);
    if (!price) errs.price = "Price is required";
    else if (isNaN(numericPrice) || numericPrice <= 0) errs.price = "Enter a valid price";

    if (!category) errs.category = "Select a category";
    if (images.length === 0) errs.images = "Add at least one image";

    return errs;
  }, [title, description, price, category, images]);

  const handleAddImages = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const remaining = MAX_IMAGES - images.length;
      const newFiles = Array.from(files).slice(0, remaining);

      const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
      setImages((prev) => [...prev, ...newFiles]);
      setPreviews((prev) => [...prev, ...newPreviews]);
      setErrors((prev) => ({ ...prev, images: undefined }));

      // Reset input so the same file can be picked again
      if (fileRef.current) fileRef.current.value = "";
    },
    [images.length]
  );

  const handleRemoveImage = useCallback((index: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validate();
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setSubmitting(true);
      try {
        await createListing({
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          category,
          condition,
          images,
        });
        setSubmitted(true);
        setTimeout(onSuccess, 1500);
      } catch {
        setErrors({ title: "Failed to create listing. Please try again." });
      } finally {
        setSubmitting(false);
      }
    },
    [title, description, price, category, condition, images, validate, onSuccess]
  );

  // Success view
  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <span className="flex items-center justify-center mx-auto size-14 rounded-full bg-primary/10 mb-4">
              <FiCheck size={28} className="text-primary" />
            </span>
            <h2 className="text-lg font-bold text-foreground mb-1 font-serif">Listing Created</h2>
            <p className="text-sm text-muted-foreground">
              Your listing is now live on the marketplace.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 sm:px-6 py-3 bg-card border-b border-border">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex items-center justify-center size-9 rounded-full bg-secondary hover:bg-accent transition-colors"
        >
          <FiArrowLeft size={18} className="text-secondary-foreground" />
        </button>
        <h1 className="text-sm sm:text-base font-semibold text-card-foreground font-serif">
          Create Listing
        </h1>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 mx-auto w-full max-w-3xl p-4 sm:p-6">
        <div className="flex flex-col gap-5">
          {/* Image upload */}
          <fieldset>
            <legend className="text-sm font-semibold text-foreground mb-2">
              Photos ({images.length}/{MAX_IMAGES})
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {previews.map((src, i) => (
                <div
                  key={i}
                  className="relative size-20 sm:size-24 rounded-lg overflow-hidden border border-border bg-muted"
                >
                  <img
                    src={src}
                    alt={`Upload ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    aria-label={`Remove image ${i + 1}`}
                    className="absolute top-1 right-1 flex items-center justify-center size-5 rounded-full bg-foreground/70 text-background hover:bg-foreground transition-colors"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center size-20 sm:size-24 rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted transition-colors text-muted-foreground"
                >
                  <FiCamera size={20} />
                  <span className="text-[10px] sm:text-xs mt-1">Add</span>
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddImages}
                className="hidden"
                aria-label="Upload images"
              />
            </div>
            {errors.images && (
              <p className="text-xs text-destructive mt-1.5">{errors.images}</p>
            )}
          </fieldset>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-semibold text-foreground">
              Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="What are you selling?"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              maxLength={100}
              className="h-10 sm:h-11 rounded-lg border border-border bg-card px-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-semibold text-foreground">
              Description
            </label>
            <textarea
              id="description"
              placeholder="Describe your item in detail..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              rows={4}
              maxLength={1000}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="price" className="text-sm font-semibold text-foreground">
              Price (NGN)
            </label>
            <input
              id="price"
              type="number"
              inputMode="numeric"
              placeholder="0"
              min="0"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setErrors((prev) => ({ ...prev, price: undefined }));
              }}
              className="h-10 sm:h-11 rounded-lg border border-border bg-card px-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.price && (
              <p className="text-xs text-destructive">{errors.price}</p>
            )}
          </div>

          {/* Category dropdown */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="category" className="text-sm font-semibold text-foreground">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setErrors((prev) => ({ ...prev, category: undefined }));
              }}
              className="h-10 sm:h-11 rounded-lg border border-border bg-card px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
            >
              <option value="" disabled>
                Select a category
              </option>
              {FORM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category}</p>
            )}
          </div>

          {/* Condition selector */}
          <fieldset>
            <legend className="text-sm font-semibold text-foreground mb-2">Condition</legend>
            <div className="flex gap-3">
              {CONDITION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCondition(opt)}
                  className={`flex-1 h-10 sm:h-11 rounded-lg border text-sm font-medium transition-colors ${
                    condition === opt
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-card-foreground hover:bg-accent"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 sm:h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {submitting ? "Creating..." : "Create Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
