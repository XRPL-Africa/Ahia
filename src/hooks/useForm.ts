// src/hooks/useForm.ts

'use client'; // Next.js Client Component

import { useState, useCallback } from 'react';
import { FormErrors, hasErrors } from '../utils/validation';

interface UseFormOptions<T> {
  initialValues: T;
  validate: (values: T) => FormErrors;
  onSubmit: (values: T) => Promise<void>;
}

interface UseFormReturn<T> {
  values: T;
  errors: FormErrors;
  loading: boolean;
  apiError: string;
  isValid: boolean;
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: () => Promise<void>;
  setApiError: (error: string) => void;
  resetForm: () => void;
}

/**
 * Reusable form hook for all Ahia forms
 * Handles: validation, submission, error states, loading
 *
 * Usage:
 * const { values, errors, loading, handleChange, handleBlur, handleSubmit } = useForm({
 *   initialValues: { email: '', password: '' },
 *   validate: validateLoginForm,
 *   onSubmit: async (values) => { await authService.login(values.email, values.password) }
 * });
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Update field value + validate if already touched
  const handleChange = useCallback(
    (field: keyof T, value: any) => {
      const newValues = { ...values, [field]: value };
      setValues(newValues);

      // Real-time validation only for touched fields
      if (touched[field as string]) {
        setErrors(validate(newValues));
      }

      // Clear API error when user types
      if (apiError) setApiError('');
    },
    [values, touched, validate, apiError]
  );

  // Mark field as touched + validate on blur
  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field as string]: true }));
      setErrors(validate(values));
    },
    [values, validate]
  );

  // Submit form - validate all fields first
  const handleSubmit = useCallback(async () => {
    // Mark ALL fields as touched
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);

    // Validate everything
    const newErrors = validate(values);
    setErrors(newErrors);

    // Stop if there are errors
    if (hasErrors(newErrors)) {
      console.log('Form validation failed:', newErrors);
      return;
    }

    // Submit!
    setLoading(true);
    setApiError('');

    try {
      await onSubmit(values);
      console.log('Form submitted successfully');
    } catch (error: any) {
      const message =
        error.message || 'Something went wrong. Please try again.';
      setApiError(message);
      console.error('Form submission error:', message);
    } finally {
      setLoading(false);
    }
  }, [values, validate, onSubmit]);

  // Reset everything back to initial state
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setApiError('');
    setLoading(false);
  }, [initialValues]);

  return {
    values,
    errors,
    loading,
    apiError,
    isValid: !hasErrors(validate(values)),
    handleChange,
    handleBlur,
    handleSubmit,
    setApiError,
    resetForm,
  };
}