import React from 'react';
import { z } from 'zod';

// Common validation schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email is too long');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name is too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const phoneSchema = z
  .string()
  .regex(/^[+]?[\d\s()-]+$/, 'Please enter a valid phone number')
  .min(10, 'Phone number must be at least 10 digits');

export const specialtySchema = z
  .string()
  .min(2, 'Specialty is required')
  .max(100, 'Specialty is too long');

export const bioSchema = z
  .string()
  .max(500, 'Bio is too long')
  .optional();

export const yearsExperienceSchema = z
  .number()
  .min(0, 'Experience cannot be negative')
  .max(70, 'Experience seems unrealistic')
  .int('Years must be a whole number');

export const consultationFeeSchema = z
  .number()
  .min(0, 'Fee cannot be negative')
  .max(10000, 'Fee seems too high')
  .multipleOf(0.01, 'Fee must have at most 2 decimal places');

// Form-specific schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: nameSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const doctorProfileSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional().nullable(),
  specialty: specialtySchema,
  bio: bioSchema,
  yearsExperience: yearsExperienceSchema,
  consultationFee: consultationFeeSchema,
});

export const appointmentSchema = z.object({
  doctorId: z.string().min(1, 'Please select a doctor'),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(200, 'Reason is too long'),
});

export const patientProfileSchema = z.object({
  fullName: nameSchema.optional().nullable(),
  phone: phoneSchema.optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  address: z.string().max(200, 'Address is too long').optional().nullable(),
  emergencyContact: z.object({
    name: nameSchema,
    phone: phoneSchema,
    relationship: z.string().max(50, 'Relationship is too long'),
  }).optional().nullable(),
});

// Validation utilities
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Sanitization utilities
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/[^\d+()-\s]/g, '');
};

// Security utilities
export const isValidPassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
};

export const isStrongPassword = (password: string): { isStrong: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (password.length < 12) issues.push('Password should be at least 12 characters');
  if (!/[A-Z]/.test(password)) issues.push('Missing uppercase letter');
  if (!/[a-z]/.test(password)) issues.push('Missing lowercase letter');
  if (!/[0-9]/.test(password)) issues.push('Missing number');
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('Missing special character');
  if (/(.)\1{2,}/.test(password)) issues.push('Avoid repeated characters');
  if (/password|123456|qwerty/i.test(password)) issues.push('Avoid common passwords');
  
  return {
    isStrong: issues.length === 0,
    issues
  };
};

// Rate limiting utilities
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();

  return (identifier: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const userRequests = requests.get(identifier) || [];
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    requests.set(identifier, validRequests);
    return true;
  };
};

// Input masking utilities
export const maskPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};

export const maskCreditCard = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, '');
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

// Form field validation hooks
export const useFieldValidation = <T>(schema: z.ZodSchema<T>) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const validateField = React.useCallback((field: string, value: any) => {
    try {
      schema.parse({ [field]: value });
      setErrors(prev => ({ ...prev, [field]: '' }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => err.path[0] === field);
        if (fieldError) {
          setErrors(prev => ({ ...prev, [field]: fieldError.message }));
          return false;
        }
      }
      return true;
    }
  }, [schema]);

  const touchField = React.useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    touched,
    validateField,
    touchField,
    clearErrors,
    hasError: (field: string) => touched[field] && !!errors[field],
    getError: (field: string) => touched[field] ? errors[field] : '',
  };
};
