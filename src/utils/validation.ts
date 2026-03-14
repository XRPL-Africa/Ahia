// src/utils/validation.ts

// ============================================
// TYPES
// ============================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  campus_id: string;
  termsAccepted: boolean;
}

export interface ListingFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  images: File[];
}

// ============================================
// FIELD VALIDATORS
// ============================================

export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '')
    return { valid: false, error: 'Email is required' };

  if (!email.includes('@') || !email.includes('.'))
    return { valid: false, error: 'Please enter a valid email address' };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return { valid: false, error: 'Please enter a valid email address' };

  return { valid: true };
};

export const validateLoginPassword = (password: string): ValidationResult => {
  if (!password || password.trim() === '')
    return { valid: false, error: 'Password is required' };

  if (password.length < 8)
    return {
      valid: false,
      error: 'Password must be at least 8 characters',
    };

  return { valid: true };
};

export const validateSignUpPassword = (password: string): ValidationResult => {
  if (!password || password.trim() === '')
    return { valid: false, error: 'Password is required' };

  if (password.length < 8)
    return {
      valid: false,
      error: 'Password must be at least 8 characters',
    };

  if (!/\d/.test(password))
    return {
      valid: false,
      error: 'Password must contain at least one number',
    };

  return { valid: true };
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (!confirmPassword || confirmPassword.trim() === '')
    return { valid: false, error: 'Please confirm your password' };

  if (password !== confirmPassword)
    return { valid: false, error: 'Passwords do not match' };

  return { valid: true };
};

export const validateName = (name: string): ValidationResult => {
  if (!name || name.trim() === '')
    return { valid: false, error: 'Full name is required' };

  if (name.trim().length < 2)
    return { valid: false, error: 'Name must be at least 2 characters' };

  return { valid: true };
};

export const validateCampus = (campus_id: string): ValidationResult => {
  const validCampuses = ['UNIBEN', 'UNILAG', 'UI', 'UNN'];

  if (!campus_id || campus_id.trim() === '')
    return { valid: false, error: 'Please select your campus' };

  if (!validCampuses.includes(campus_id))
    return { valid: false, error: 'Please select a valid campus' };

  return { valid: true };
};

export const validateTerms = (accepted: boolean): ValidationResult => {
  if (!accepted)
    return {
      valid: false,
      error: 'You must accept the terms and conditions',
    };

  return { valid: true };
};

export const validateTitle = (title: string): ValidationResult => {
  if (!title || title.trim() === '')
    return { valid: false, error: 'Title is required' };

  if (title.trim().length < 10)
    return {
      valid: false,
      error: `Title must be at least 10 characters (${title.trim().length}/10)`,
    };

  if (title.trim().length > 100)
    return {
      valid: false,
      error: `Title must be less than 100 characters (${title.trim().length}/100)`,
    };

  return { valid: true };
};

export const validateDescription = (description: string): ValidationResult => {
  if (!description || description.trim() === '')
    return { valid: false, error: 'Description is required' };

  if (description.trim().length < 20)
    return {
      valid: false,
      error: `Description must be at least 20 characters (${description.trim().length}/20)`,
    };

  if (description.trim().length > 500)
    return {
      valid: false,
      error: `Description must be less than 500 characters (${description.trim().length}/500)`,
    };

  return { valid: true };
};

export const validatePrice = (price: string): ValidationResult => {
  if (!price || price.trim() === '')
    return { valid: false, error: 'Price is required' };

  const numPrice = parseFloat(price);

  if (isNaN(numPrice))
    return { valid: false, error: 'Price must be a valid number' };

  if (numPrice <= 0)
    return { valid: false, error: 'Price must be greater than 0' };

  return { valid: true };
};

export const validateImages = (images: File[]): ValidationResult => {
  if (!images || images.length === 0)
    return { valid: false, error: 'At least 1 image is required' };

  if (images.length > 5)
    return { valid: false, error: 'Maximum 5 images allowed' };

  for (const image of images) {
    if (image.size > 5 * 1024 * 1024)
      return {
        valid: false,
        error: `Image "${image.name}" exceeds 5MB limit`,
      };
  }

  return { valid: true };
};

export const validateCategory = (category: string): ValidationResult => {
  if (!category || category.trim() === '')
    return { valid: false, error: 'Please select a category' };

  return { valid: true };
};

export const validateCondition = (condition: string): ValidationResult => {
  const validConditions = ['new', 'used', 'refurbished'];

  if (!condition || condition.trim() === '')
    return { valid: false, error: 'Please select item condition' };

  if (!validConditions.includes(condition))
    return { valid: false, error: 'Please select a valid condition' };

  return { valid: true };
};

// ============================================
// FORM-LEVEL VALIDATORS
// ============================================

export const validateLoginForm = (data: LoginFormData): FormErrors => {
  const errors: FormErrors = {};

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) errors.email = emailResult.error!;

  const passwordResult = validateLoginPassword(data.password);
  if (!passwordResult.valid) errors.password = passwordResult.error!;

  return errors;
};

export const validateSignUpForm = (data: SignUpFormData): FormErrors => {
  const errors: FormErrors = {};

  const nameResult = validateName(data.name);
  if (!nameResult.valid) errors.name = nameResult.error!;

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) errors.email = emailResult.error!;

  const passwordResult = validateSignUpPassword(data.password);
  if (!passwordResult.valid) errors.password = passwordResult.error!;

  const confirmResult = validateConfirmPassword(
    data.password,
    data.confirmPassword
  );
  if (!confirmResult.valid) errors.confirmPassword = confirmResult.error!;

  const campusResult = validateCampus(data.campus_id);
  if (!campusResult.valid) errors.campus_id = campusResult.error!;

  const termsResult = validateTerms(data.termsAccepted);
  if (!termsResult.valid) errors.termsAccepted = termsResult.error!;

  return errors;
};

export const validateListingForm = (data: ListingFormData): FormErrors => {
  const errors: FormErrors = {};

  const titleResult = validateTitle(data.title);
  if (!titleResult.valid) errors.title = titleResult.error!;

  const descResult = validateDescription(data.description);
  if (!descResult.valid) errors.description = descResult.error!;

  const priceResult = validatePrice(data.price);
  if (!priceResult.valid) errors.price = priceResult.error!;

  const categoryResult = validateCategory(data.category);
  if (!categoryResult.valid) errors.category = categoryResult.error!;

  const conditionResult = validateCondition(data.condition);
  if (!conditionResult.valid) errors.condition = conditionResult.error!;

  const imagesResult = validateImages(data.images);
  if (!imagesResult.valid) errors.images = imagesResult.error!;

  return errors;
};

// ============================================
// HELPERS
// ============================================

export const hasErrors = (errors: FormErrors): boolean =>
  Object.keys(errors).length > 0;

export const isFormValid = (errors: FormErrors): boolean =>
  !hasErrors(errors);