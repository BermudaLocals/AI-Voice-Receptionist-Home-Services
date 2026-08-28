import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateCallSummary } from '@/lib/openai';
import { sendSMS } from '@/lib/twilio';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;

    const call = await prisma.call.update({
      where: { twilioCallSid: callSid },
      data: {
        recordingUrl: recordingUrl ? `${recordingUrl}.mp3` : undefined,
        recordingDuration: recordingDuration ? parseInt(recordingDuration) : undefined,
      },
      include: { business: { include: { users: true } } },
    });

    if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });

    // If we have a transcript, generate summary
    if (call.transcript) {
      const summary = await generateCallSummary(call.transcript);

      await prisma.call.update({
        where: { id: call.id },
        data: {
          summary: summary.summary,
          serviceMentioned: summary.service,
          urgency: summary.urgency.toUpperCase() as any,
          qualified: summary.qualified,
        },
      });

      // Send SMS summary to owner
      const owner = call.business.users.find(u => u.role === 'OWNER');
      if (owner?.phone && owner.notifySms) {
        const status = call.outcome === 'BOOKED' ? '✅ BOOKED' : 
                      call.outcome === 'QUALIFIED' ? '📋 QUALIFIED' : 
                      call.outcome === 'MISSED' ? '❌ MISSED' : '📞 HANDLED';

        await sendSMS(
          owner.phone,
          `ReceptionAI: ${status}\n${call.fromNumber}\n${summary.summary}\nService: ${summary.service || 'N/A'}\nUrgency: ${summary.urgency}`
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Recording callback error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
