import { z } from 'zod';

export const businessSettingsSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+1[0-9]{10}$/, 'Must be a valid US phone number with +1 prefix'),
  email: z.string().email(),
  address: z.string().optional(),
  timezone: z.string().default('America/New_York'),
  greetingScript: z.string().max(500),
  voiceStyle: z.enum(['friendly-professional', 'casual', 'formal', 'energetic']),
  holdMessage: z.string().max(300),
  hours: z.record(z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  })).optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
  duration: z.number().min(15).max(480).default(60),
});

export const bookingSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().regex(/^\+1[0-9]{10}$/),
  customerEmail: z.string().email().optional(),
  customerAddress: z.string().optional(),
  serviceName: z.string().min(1),
  serviceId: z.string().optional(),
  scheduledDate: z.string().datetime(),
  duration: z.number().min(15).default(60),
  notes: z.string().optional(),
  estimatedRevenue: z.number().optional(),
});

export const callFilterSchema = z.object({
  status: z.enum(['RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'BUSY', 'NO_ANSWER', 'VOICEMAIL']).optional(),
  outcome: z.enum(['PENDING', 'BOOKED', 'QUALIFIED', 'MISSED', 'SPAM', 'VOICEMAIL', 'TRANSFERRED', 'CALLBACK_REQUESTED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});
