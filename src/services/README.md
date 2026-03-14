# Ahia API Services

This folder contains all API integration services for the Ahia Campus Marketplace web application.

## Overview

 A complete service layer that connects the frontend to the backend API. These services handle authentication, listings, file uploads, and form validation.

## Folder Structure

```
services/
├── api.ts                    # Axios instance with JWT, retry logic
├── auth.service.ts           # Authentication endpoints
├── listing.service.ts        # Marketplace listings endpoints
├── upload.service.ts         # File upload endpoints
└── mock/                     # Mock services for development
    ├── auth.service.mock.ts
    ├── listing.service.mock.ts
    └── upload.service.mock.ts

utils/
└── validation.ts             # Form validation logic

hooks/
└── useForm.ts                # Reusable form hook
```

## Getting Started

### 1. Install Dependencies

Make sure these are installed:

```bash
npm install axios
```

### 2. Configure Backend URL

Edit `services/api.ts` and update the backend URL:

```typescript
const BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000/api'  // Update port if needed
    : 'https://api.ahiamarket.app/api';
```

### 3. Usage in Components

#### Authentication Example

```typescript
import authService from '@/services/auth.service';

// Login
try {
  const response = await authService.login(email, password);
  console.log('User:', response.user);
  // Navigate to dashboard
} catch (error) {
  console.error('Login failed:', error.message);
}

// Register
try {
  const response = await authService.register({
    name: 'Oluwasafari',
    email: 'Safari@funaab.edu.ng',
    password: 'Password123',
    campus_id: 'Funaab',
    student_id: 'UNI/20/12345'
  });
  console.log('Registration successful');
} catch (error) {
  console.error('Registration failed:', error.message);
}
```

#### Listings Example

```typescript
import listingService from '@/services/listing.service';

// Fetch listings
const listings = await listingService.fetchListings({
  campus_id: 'UNIBEN',
  page: 1,
  limit: 20,
  category: 'Electronics'
});

// Create listing
const newListing = await listingService.createListing({
  title: 'iPhone 13 Pro Max',
  description: 'Barely used, excellent condition',
  price: 450000,
  category: 'Electronics',
  condition: 'used',
  images: ['url1', 'url2']
});
```

#### File Upload Example

```typescript
import uploadService from '@/services/upload.service';

// Upload with progress
await uploadService.uploadWithProgress(imageFile, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});

// Upload student ID
const response = await uploadService.uploadID(imageFile, userId);
```

#### Form Validation Example

```typescript
import { validateLoginForm } from '@/utils/validation';
import { useForm } from '@/hooks/useForm';

const { values, errors, loading, handleChange, handleBlur, handleSubmit } = useForm({
  initialValues: { email: '', password: '' },
  validate: validateLoginForm,
  onSubmit: async (values) => {
    await authService.login(values.email, values.password);
  }
});
```
