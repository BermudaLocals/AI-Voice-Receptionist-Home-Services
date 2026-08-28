// Shared types and utilities across the monorepo

export const PLAN_LIMITS = {
  STARTER: { calls: 100, price: 14900, name: "Starter" },
  PROFESSIONAL: { calls: 300, price: 29900, name: "Professional" },
  ENTERPRISE: { calls: Infinity, price: 59900, name: "Enterprise" },
} as const;

export const OVERAGE_RATE_CENTS = 35;

export type Plan = keyof typeof PLAN_LIMITS;

export interface CallTranscript {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface StreamMessage {
  event: "start" | "media" | "stop" | "mark";
  streamSid?: string;
  media?: {
    payload: string;
    track?: string;
    chunk?: string;
    timestamp?: string;
  };
  start?: {
    streamSid: string;
    accountSid: string;
    callSid: string;
    tracks?: string[];
    customParameters?: Record<string, string>;
  };
  stop?: {
    streamSid: string;
    accountSid: string;
    callSid: string;
  };
  mark?: {
    name: string;
  };
}
