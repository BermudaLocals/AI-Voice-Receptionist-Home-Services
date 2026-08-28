export interface Business {
  id: string
  name: string
  phone: string
  email: string
  address?: string
  timezone: string
  greetingScript: string
  voiceStyle: string
  holdMessage: string
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  planStatus: string
  trialEndsAt?: Date
  callsThisPeriod: number
  overageCalls: number
  reviewAddonEnabled: boolean
  services: Service[]
  users: BusinessUser[]
  createdAt: Date
  updatedAt: Date
}

export interface Service {
  id: string
  businessId: string
  name: string
  description?: string
  priceRange?: { min: number; max: number }
  duration: number
  isActive: boolean
}

export interface BusinessUser {
  id: string
  businessId: string
  clerkUserId: string
  email: string
  name?: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  phone?: string
  notifySms: boolean
  notifyEmail: boolean
}

export interface Call {
  id: string
  businessId: string
  twilioCallSid: string
  fromNumber: string
  toNumber: string
  direction: 'INBOUND' | 'OUTBOUND'
  status: string
  startedAt: Date
  endedAt?: Date
  duration?: number
  recordingUrl?: string
  transcript?: string
  summary?: string
  serviceMentioned?: string
  addressMentioned?: string
  urgency: string
  budgetMentioned?: string
  outcome: string
  bookingId?: string
  booking?: Booking
  revenue?: number
  qualified: boolean
  createdAt: Date
}

export interface Booking {
  id: string
  businessId: string
  callId?: string
  call?: Call
  customerName?: string
  customerPhone: string
  customerEmail?: string
  customerAddress?: string
  serviceName: string
  serviceId?: string
  notes?: string
  scheduledDate: Date
  duration: number
  status: string
  googleEventId?: string
  estimatedRevenue?: number
  actualRevenue?: number
  reviewRequested: boolean
  reviewSentAt?: Date
  reviewReceived: boolean
  reviewRating?: number
  createdAt: Date
}

export interface Notification {
  id: string
  businessId: string
  type: string
  title: string
  body: string
  data?: any
  read: boolean
  sentAt: Date
}

export interface UsageStats {
  plan: string
  planName: string
  limit: string | number
  used: number
  remaining: string | number
  overageCalls: number
  overageCost: number
  periodStart: Date
  periodEnd: Date
}
