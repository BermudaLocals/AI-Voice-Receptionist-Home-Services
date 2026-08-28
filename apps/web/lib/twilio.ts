import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

export const twilioClient = twilio(accountSid, authToken);

export async function sendSMS(to: string, body: string, businessPhone?: string) {
  return twilioClient.messages.create({
    body,
    from: businessPhone || fromNumber,
    to,
  });
}

export async function makeCall(to: string, twimlUrl: string, statusCallback?: string) {
  return twilioClient.calls.create({
    to,
    from: fromNumber,
    url: twimlUrl,
    statusCallback,
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    statusCallbackMethod: 'POST',
  });
}

export async function getRecordingUrl(callSid: string) {
  const recordings = await twilioClient.recordings.list({ callSid });
  return recordings[0]?.uri.replace('.json', '.mp3') || null;
}

export function generateTwiml(response: twilio.twiml.VoiceResponse): string {
  return response.toString();
}
