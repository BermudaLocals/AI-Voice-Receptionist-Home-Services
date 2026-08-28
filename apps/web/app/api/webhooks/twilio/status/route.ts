import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;

    const statusMap: Record<string, string> = {
      'queued': 'RINGING',
      'ringing': 'RINGING',
      'in-progress': 'IN_PROGRESS',
      'completed': 'COMPLETED',
      'busy': 'BUSY',
      'failed': 'FAILED',
      'no-answer': 'NO_ANSWER',
      'canceled': 'FAILED',
    };

    await prisma.call.update({
      where: { twilioCallSid: callSid },
      data: {
        status: statusMap[callStatus] || 'COMPLETED',
        duration: callDuration ? parseInt(callDuration) : undefined,
        recordingUrl: recordingUrl || undefined,
        recordingDuration: recordingDuration ? parseInt(recordingDuration) : undefined,
        endedAt: ['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(callStatus) 
          ? new Date() 
          : undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Status callback error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
