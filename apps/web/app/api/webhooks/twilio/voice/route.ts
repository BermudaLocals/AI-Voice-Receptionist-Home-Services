import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { prisma } from '@/lib/db';
import { trackCall } from '@/lib/usage';
import { getBusinessById } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const businessPhone = to; // The Twilio number dialed

    // Find business by their Twilio phone number
    const business = await prisma.business.findFirst({
      where: { phone: businessPhone },
      include: { services: true },
    });

    if (!business) {
      const response = new twilio.twiml.VoiceResponse();
      response.say('Sorry, this number is not configured. Please try again later.');
      return new NextResponse(response.toString(), {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Track usage
    const usage = await trackCall(business.id);

    // Create call record
    const call = await prisma.call.create({
      data: {
        businessId: business.id,
        twilioCallSid: callSid,
        fromNumber: from,
        toNumber: to,
        status: 'RINGING',
      },
    });

    // Build TwiML response
    const response = new twilio.twiml.VoiceResponse();

    // Start streaming to our websocket for AI handling
    const connect = response.connect();
    connect.stream({
      url: `${process.env.APP_URL}/api/voice/stream?callId=${call.id}&businessId=${business.id}`,
    });

    // Fallback if stream fails
    response.say(business.greetingScript);
    response.pause({ length: 2 });
    response.say('I am connecting you to our scheduling system. Please hold.');

    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Twilio voice webhook error:', error);
    const response = new twilio.twiml.VoiceResponse();
    response.say('Sorry, we are experiencing technical difficulties. Please call back later.');
    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
