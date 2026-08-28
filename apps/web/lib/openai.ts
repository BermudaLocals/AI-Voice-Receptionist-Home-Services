import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ConversationContext {
  businessName: string;
  services: Array<{ name: string; description?: string; priceRange?: { min: number; max: number } }>;
  hours?: Record<string, { open: string; close: string }>;
  address?: string;
  currentCallId: string;
}

export function buildSystemPrompt(context: ConversationContext): string {
  const servicesList = context.services.map(s => {
    let info = `- ${s.name}`;
    if (s.priceRange) info += ` (typically $${s.priceRange.min}-$${s.priceRange.max})`;
    if (s.description) info += `: ${s.description}`;
    return info;
  }).join('\n');

  return `You are the AI receptionist for ${context.businessName}. You answer phone calls, qualify leads, and book appointments.

BUSINESS INFO:
- Name: ${context.businessName}
- Services offered:
${servicesList}
${context.address ? `- Service area/Address: ${context.address}` : ''}

YOUR GOALS:
1. Greet the caller warmly and professionally
2. Identify what service they need
3. Get their address/location
4. Assess urgency (emergency, same-day, or scheduled)
5. Check calendar availability and book if possible
6. If you can't book, qualify them and schedule a callback
7. Get their name and callback number
8. Provide rough pricing estimates when asked

RULES:
- Be concise but friendly. Home service callers want quick answers.
- Never say "I am an AI" or "I am a robot." Say "I'm calling from ${context.businessName}."
- If they ask for pricing, give the range from the services list.
- If they need emergency service, prioritize and offer the next available slot.
- Always confirm the appointment details before ending the call.
- If they want to speak to a human, offer to take a message and promise a callback within 30 minutes.
- Keep responses under 3 sentences when possible.

You have access to these tools:
- check_availability(date: string, duration: number)
- book_appointment(date: string, time: string, service: string, customerName: string, phone: string, address: string, notes: string)
- send_sms_confirmation(phone: string, details: string)
- transfer_to_human(reason: string)

Current call ID: ${context.currentCallId}`;
}

export async function generateAIResponse(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  context: ConversationContext
) {
  const systemMessage = buildSystemPrompt(context);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemMessage },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 300,
    tools: [
      {
        type: 'function',
        function: {
          name: 'check_availability',
          description: 'Check if a time slot is available',
          parameters: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
              duration: { type: 'number', description: 'Duration in minutes' },
            },
            required: ['date', 'duration'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'book_appointment',
          description: 'Book an appointment',
          parameters: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
              time: { type: 'string', description: 'Time in HH:MM format' },
              service: { type: 'string' },
              customerName: { type: 'string' },
              phone: { type: 'string' },
              address: { type: 'string' },
              notes: { type: 'string' },
            },
            required: ['date', 'time', 'service', 'customerName', 'phone', 'address'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'send_sms_confirmation',
          description: 'Send SMS confirmation to customer',
          parameters: {
            type: 'object',
            properties: {
              phone: { type: 'string' },
              details: { type: 'string' },
            },
            required: ['phone', 'details'],
          },
        },
      },
    ],
    tool_choice: 'auto',
  });

  return completion.choices[0];
}

export async function generateCallSummary(transcript: string): Promise<{ summary: string; service?: string; urgency: string; qualified: boolean }> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Analyze this call transcript and return a JSON object with:
- summary: A 2-sentence summary of what the caller needed
- service: The service they requested (if identifiable)
- urgency: "emergency", "high", "medium", "low", or "unknown"
- qualified: boolean (did they provide enough info to be a real lead?)

Respond ONLY with valid JSON.`,
      },
      { role: 'user', content: transcript },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  return {
    summary: result.summary || 'No summary available',
    service: result.service,
    urgency: result.urgency || 'unknown',
    qualified: result.qualified || false,
  };
}
