import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

type MinimalTripContext = {
  title: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  budgetCents: number;
  currency: string;
  travelerCount: number;
  notes?: string | null;
};

function getModel() {
  if (process.env.AI_PROVIDER === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    return anthropic(process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-latest');
  }

  if (process.env.OPENAI_API_KEY) {
    return openai(process.env.OPENAI_MODEL ?? 'gpt-4.1-mini');
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic(process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-latest');
  }

  throw new Error('AI_NOT_CONFIGURED');
}

function serializePackages(packages: Array<any>) {
  return packages.slice(0, 4).map((pkg) => ({
    label: pkg.label,
    totalPrice: `${pkg.currency} ${(pkg.totalPriceCents / 100).toFixed(2)}`,
    explanation: pkg.explanation,
    flight: {
      airline: pkg.flightOption.airline,
      flightNumber: pkg.flightOption.flightNumber,
      departure: pkg.flightOption.departureTime,
      arrival: pkg.flightOption.arrivalTime,
      stops: pkg.flightOption.stops,
      refundable: pkg.flightOption.refundable
    },
    hotel: {
      name: pkg.hotelOption.name,
      stars: pkg.hotelOption.stars,
      totalPrice: `${pkg.currency} ${(pkg.hotelOption.totalPriceCents / 100).toFixed(2)}`,
      refundable: pkg.hotelOption.refundable,
      cancellationDeadline: pkg.hotelOption.cancellationDeadline
    }
  }));
}

export const aiService = {
  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
  },

  async generateRecommendationSummary(input: { trip: MinimalTripContext; packages: Array<any> }) {
    if (!this.isConfigured()) {
      return 'AI recommendations are unavailable until AI_PROVIDER and the relevant provider API key are configured. The ranking shown below is deterministic and provider-backed.';
    }

    try {
      const result = await generateText({
        model: getModel() as any,
        system: [
          'You are a product-grade travel planning assistant.',
          'Summarize the tradeoffs between travel packages honestly.',
          'Never say a booking has been finalized unless explicit booking status says confirmed.',
          'Keep the answer under 180 words.'
        ].join(' '),
        prompt: JSON.stringify({
          trip: input.trip,
          packages: serializePackages(input.packages)
        })
      });

      return result.text;
    } catch (error) {
      console.error('aiService.generateRecommendationSummary failed', error);
      return 'Tripmate ranked these provider-backed packages deterministically. AI commentary is temporarily unavailable, but the package ordering and provider quotes are still current.';
    }
  },

  async replyToTripChat(input: {
    trip: MinimalTripContext & { bookingState?: string | null };
    packages: Array<any>;
    history: Array<{ role: string; content: string }>;
    userMessage: string;
  }) {
    const result = await generateText({
      model: getModel() as any,
      system: [
        'You are Tripmate, an expert travel advisor embedded inside a booking workflow.',
        'Use only the provided trip data and packages.',
        'Offer concrete tradeoffs, savings ideas, and itinerary reasoning.',
        'Never claim you booked, ticketed, or confirmed travel unless the booking state explicitly says CONFIRMED.',
        'If fulfillment is pending manual review, say that clearly.',
        'Be concise and useful.'
      ].join(' '),
      prompt: JSON.stringify({
        trip: input.trip,
        packages: serializePackages(input.packages),
        history: input.history.slice(-8),
        question: input.userMessage
      })
    });

    return result.text;
  }
};
