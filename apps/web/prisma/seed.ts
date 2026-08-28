import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a demo business (for development only)
  const business = await prisma.business.upsert({
    where: { clerkOrgId: "org_demo_123" },
    update: {},
    create: {
      clerkOrgId: "org_demo_123",
      name: "Demo HVAC Services",
      phone: "+15551234567",
      email: "demo@receptionai.dev",
      address: "123 Main St, Springfield, IL",
      timezone: "America/Chicago",
      greetingScript: "Hello! You've reached Demo HVAC Services. I'm your AI assistant. How can I help you today?",
      voiceStyle: "friendly-professional",
      holdMessage: "Please hold while I check our schedule for you.",
      plan: "PROFESSIONAL",
      planStatus: "ACTIVE",
      services: {
        create: [
          { name: "AC Repair", description: "Air conditioning repair and troubleshooting", priceRange: { min: 150, max: 400 }, duration: 90 },
          { name: "AC Maintenance", description: "Annual maintenance and tune-up", priceRange: { min: 89, max: 150 }, duration: 60 },
          { name: "Heating Repair", description: "Furnace and heating system repair", priceRange: { min: 150, max: 500 }, duration: 90 },
          { name: "Emergency Service", description: "24/7 emergency HVAC service", priceRange: { min: 250, max: 800 }, duration: 120 },
        ],
      },
    },
  });

  // Create demo calls
  await prisma.call.createMany({
    data: [
      {
        businessId: business.id,
        twilioCallSid: "CA_demo_001",
        fromNumber: "+15552345678",
        toNumber: "+15551234567",
        status: "COMPLETED",
        duration: 204,
        transcript: "AI: Hello! You've reached Demo HVAC. How can I help?\nCaller: My AC is not working.\nAI: I'm sorry to hear that. What's your address?\nCaller: 456 Oak Street.\nAI: Got it. Is this urgent or can it wait until tomorrow?\nCaller: It's pretty hot.\nAI: I have an opening tomorrow at 10 AM. Does that work?\nCaller: Yes.\nAI: Great! You're all set. See you tomorrow at 10 AM.",
        summary: "Customer reported AC not cooling. Scheduled for tomorrow 10 AM. Estimated $180-250.",
        serviceMentioned: "AC Repair",
        addressMentioned: "456 Oak Street",
        urgency: "HIGH",
        outcome: "BOOKED",
        revenue: 220,
        qualified: true,
      },
      {
        businessId: business.id,
        twilioCallSid: "CA_demo_002",
        fromNumber: "+15559876543",
        toNumber: "+15551234567",
        status: "COMPLETED",
        duration: 105,
        transcript: "AI: Hello! You've reached Demo HVAC. How can I help?\nCaller: I need a quote for a new furnace.\nAI: I'd be happy to help with that. What's your address?\nCaller: 789 Pine Road.\nAI: Great. I'll have our technician call you back within 30 minutes with a quote.\nCaller: Okay, thanks.",
        summary: "Customer requesting furnace replacement quote. Callback scheduled.",
        serviceMentioned: "Heating Repair",
        addressMentioned: "789 Pine Road",
        urgency: "LOW",
        outcome: "QUALIFIED",
        qualified: true,
      },
      {
        businessId: business.id,
        twilioCallSid: "CA_demo_003",
        fromNumber: "+15551112222",
        toNumber: "+15551234567",
        status: "COMPLETED",
        duration: 15,
        transcript: "AI: Hello! You've reached Demo HVAC. How can I help?\nCaller: *silence* *click*",
        summary: "No response from caller. Likely wrong number or accidental dial.",
        urgency: "UNKNOWN",
        outcome: "MISSED",
        qualified: false,
      },
    ],
    skipDuplicates: true,
  });

  // Create demo bookings
  const call1 = await prisma.call.findFirst({ where: { twilioCallSid: "CA_demo_001" } });
  if (call1) {
    await prisma.booking.create({
      data: {
        businessId: business.id,
        callId: call1.id,
        customerName: "John Smith",
        customerPhone: "+15552345678",
        customerAddress: "456 Oak Street",
        serviceName: "AC Repair",
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 90,
        status: "CONFIRMED",
        estimatedRevenue: 220,
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
