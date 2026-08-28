import { WebSocketServer, WebSocket } from "ws";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import OpenAI from "openai";
import twilio from "twilio";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

interface CallContext {
  businessId: string;
  callId: string;
  businessName: string;
  services: Array<{ name: string; description?: string; priceRange?: { min: number; max: number } }>;
  greetingScript: string;
}

// Mulaw to PCM conversion
function mulawToPcm(muLawSample: number): number {
  muLawSample = ~muLawSample;
  const sign = (muLawSample & 0x80) ? -1 : 1;
  const exponent = (muLawSample >> 4) & 0x07;
  const mantissa = muLawSample & 0x0F;
  const sample = sign * (((mantissa << 1) + 33) << exponent) - 33;
  return sample;
}

function decodeMulaw(muLawData: Buffer): Int16Array {
  const pcm = new Int16Array(muLawData.length);
  for (let i = 0; i < muLawData.length; i++) {
    pcm[i] = mulawToPcm(muLawData[i]);
  }
  return pcm;
}

// PCM to Mulaw encoding
function pcmToMulaw(pcmSample: number): number {
  const BIAS = 0x84;
  const CLIP = 32635;
  let sign = (pcmSample >> 8) & 0x80;
  if (sign !== 0) pcmSample = -pcmSample;
  if (pcmSample > CLIP) pcmSample = CLIP;
  pcmSample += BIAS;
  let exponent = 7;
  for (let expMask = 0x4000; (pcmSample & expMask) === 0 && exponent > 0; exponent--, expMask >>= 1) {}
  let mantissa = (pcmSample >> (exponent + 3)) & 0x0F;
  let muLawByte = ~(sign | (exponent << 4) | mantissa);
  return muLawByte;
}

function encodeMulaw(pcmData: Int16Array): Buffer {
  const mulaw = Buffer.alloc(pcmData.length);
  for (let i = 0; i < pcmData.length; i++) {
    mulaw[i] = pcmToMulaw(pcmData[i]);
  }
  return mulaw;
}

export function startVoiceServer(port: number = 8080) {
  const wss = new WebSocketServer({ port });
  console.log(`Voice WebSocket server running on port ${port}`);

  wss.on("connection", (ws: WebSocket) => {
    let callContext: CallContext | null = null;
    let streamSid: string | null = null;
    let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
    let deepgramConnection: any = null;
    let currentTranscript = "";
    let isProcessing = false;

    ws.on("message", async (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.event === "start" && msg.start) {
          streamSid = msg.start.streamSid;
          const { callId, businessId } = msg.start.customParameters || {};

          // Fetch business context from your API
          const businessRes = await fetch(`${process.env.APP_URL}/api/business?id=${businessId}`);
          const businessData = await businessRes.json();

          callContext = {
            businessId,
            callId,
            businessName: businessData.business?.name || "Our Business",
            services: businessData.business?.services || [],
            greetingScript: businessData.business?.greetingScript || "Hello! How can I help you?",
          };

          // Initialize Deepgram live transcription
          deepgramConnection = deepgram.listen.live({
            model: "nova-2",
            smart_format: true,
            encoding: "mulaw",
            sample_rate: 8000,
            channels: 1,
          });

          deepgramConnection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
            const transcript = data.channel?.alternatives?.[0]?.transcript;
            if (transcript && data.is_final) {
              currentTranscript += " " + transcript;
              handleUserInput(currentTranscript.trim(), ws, streamSid!, callContext!, conversationHistory);
              currentTranscript = "";
            }
          });

          // Send greeting
          await speakText(callContext.greetingScript.replace("{{businessName}}", callContext.businessName), ws, streamSid);
        }

        if (msg.event === "media" && msg.media && deepgramConnection) {
          const audioBuffer = Buffer.from(msg.media.payload, "base64");
          deepgramConnection.send(audioBuffer);
        }

        if (msg.event === "stop") {
          if (deepgramConnection) {
            deepgramConnection.finish();
          }
          // Save transcript and finalize call
          if (callContext?.callId) {
            await fetch(`${process.env.APP_URL}/api/calls/${callContext.callId}/finalize`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transcript: conversationHistory.map(h => `${h.role}: ${h.content}`).join("\n") }),
            });
          }
        }
      } catch (err) {
        console.error("Voice stream error:", err);
      }
    });

    ws.on("close", () => {
      if (deepgramConnection) {
        deepgramConnection.finish();
      }
    });
  });
}

async function handleUserInput(
  input: string,
  ws: WebSocket,
  streamSid: string,
  context: CallContext,
  history: Array<{ role: "user" | "assistant"; content: string }>
) {
  history.push({ role: "user", content: input });

  const systemPrompt = `You are the AI receptionist for ${context.businessName}. You answer phone calls, qualify leads, and book appointments.

SERVICES:
${context.services.map(s => `- ${s.name}${s.priceRange ? ` ($${s.priceRange.min}-$${s.priceRange.max})` : ""}${s.description ? `: ${s.description}` : ""}`).join("\n")}

RULES:
- Be concise but friendly. Keep responses under 3 sentences.
- Never say you are an AI. Say "I'm calling from ${context.businessName}."
- Give pricing ranges when asked.
- Offer next available appointment if they want to book.
- Always confirm details before ending.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  const response = completion.choices[0].message.content || "I'm sorry, I didn't catch that. Could you repeat?";
  history.push({ role: "assistant", content: response });

  await speakText(response, ws, streamSid);
}

async function speakText(text: string, ws: WebSocket, streamSid: string) {
  // Use OpenAI TTS
  const mp3Response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
    response_format: "pcm",
  });

  const pcmBuffer = Buffer.from(await mp3Response.arrayBuffer());
  const int16Array = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.byteLength / 2);

  // Resample from 24kHz to 8kHz and convert to mulaw
  const resampled = resample24kTo8k(int16Array);
  const mulawData = encodeMulaw(resampled);

  // Send in chunks to avoid overwhelming the connection
  const chunkSize = 320; // 40ms at 8kHz
  for (let i = 0; i < mulawData.length; i += chunkSize) {
    const chunk = mulawData.subarray(i, i + chunkSize);
    const message = {
      event: "media",
      streamSid,
      media: { payload: chunk.toString("base64") },
    };
    ws.send(JSON.stringify(message));
  }
}

function resample24kTo8k(input: Int16Array): Int16Array {
  const outputLength = Math.floor(input.length / 3);
  const output = new Int16Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    output[i] = input[i * 3];
  }
  return output;
}

// Start server if run directly
if (require.main === module) {
  const port = parseInt(process.env.VOICE_PORT || "8080");
  startVoiceServer(port);
}
