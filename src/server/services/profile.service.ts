import { prisma } from '@/lib/db/prisma';
import { travelerProfileSchema } from '@/lib/validations/profile';
import { paymentMethodRepository } from '@/server/repositories/payment-method.repository';
import { stripeProvider } from '@/server/integrations/stripe-provider';
import { userRepository } from '@/server/repositories/user.repository';

async function ensureStripeCustomer(userId: string) {
  const existingCustomerId = await paymentMethodRepository.findAnyCustomerIdForUser(userId);
  if (existingCustomerId) {
    return existingCustomerId;
  }

  const user = await userRepository.findById(userId);
  const customer = await stripeProvider.createCustomer({
    userId,
    email: user?.email,
    name: user?.name
  });

  return customer.id;
}

export const profileService = {
  getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        travelerProfile: {
          include: {
            loyaltyPrograms: true
          }
        },
        paymentMethods: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
        }
      }
    });
  },

  async upsertTravelerProfile(userId: string, payload: unknown) {
    const parsed = travelerProfileSchema.parse(payload);

    return prisma.$transaction(async (tx) => {
      const profile = await tx.travelerProfile.upsert({
        where: { userId },
        create: {
          userId,
          fullLegalName: parsed.fullLegalName,
          dateOfBirth: new Date(parsed.dateOfBirth),
          nationality: parsed.nationality,
          passportNumber: parsed.passportNumber,
          passportExpiry: new Date(parsed.passportExpiry),
          passportIssuingCountry: parsed.passportIssuingCountry ?? undefined,
          phoneNumber: parsed.phoneNumber ?? undefined,
          gender: parsed.gender ?? undefined,
          homeAirportCode: parsed.homeAirportCode,
          preferredCabinClass: parsed.preferredCabinClass,
          seatPreference: parsed.seatPreference,
          preferDirectFlights: parsed.preferDirectFlights,
          preferredHotelChains: parsed.preferredHotelChains,
          bedType: parsed.bedType ?? undefined,
          smokingPreference: parsed.smokingPreference,
          accessibilityNeeds: parsed.accessibilityNeeds
        },
        update: {
          fullLegalName: parsed.fullLegalName,
          dateOfBirth: new Date(parsed.dateOfBirth),
          nationality: parsed.nationality,
          passportNumber: parsed.passportNumber,
          passportExpiry: new Date(parsed.passportExpiry),
          passportIssuingCountry: parsed.passportIssuingCountry ?? undefined,
          phoneNumber: parsed.phoneNumber ?? undefined,
          gender: parsed.gender ?? undefined,
          homeAirportCode: parsed.homeAirportCode,
          preferredCabinClass: parsed.preferredCabinClass,
          seatPreference: parsed.seatPreference,
          preferDirectFlights: parsed.preferDirectFlights,
          preferredHotelChains: parsed.preferredHotelChains,
          bedType: parsed.bedType ?? undefined,
          smokingPreference: parsed.smokingPreference,
          accessibilityNeeds: parsed.accessibilityNeeds
        }
      });

      await tx.loyaltyProgram.deleteMany({ where: { profileId: profile.id } });
      if (parsed.loyaltyPrograms.length) {
        await tx.loyaltyProgram.createMany({
          data: parsed.loyaltyPrograms.map((program) => ({
            profileId: profile.id,
            program: program.program,
            memberId: program.memberId
          }))
        });
      }

      return profile;
    });
  },

  async createSetupIntent(userId: string) {
    const customerId = await ensureStripeCustomer(userId);
    return stripeProvider.createSetupIntent({ userId, customerId });
  },

  async syncSetupIntent(userId: string, setupIntentId: string) {
    const setupIntent = await stripeProvider.retrieveSetupIntent(setupIntentId);

    if (typeof setupIntent.payment_method !== 'string' || !setupIntent.customer) {
      throw new Error('SETUP_INTENT_NOT_READY');
    }

    const paymentMethod = await stripeProvider.retrievePaymentMethod(setupIntent.payment_method);
    const customerId = typeof setupIntent.customer === 'string' ? setupIntent.customer : setupIntent.customer.id;

    if (paymentMethod.type !== 'card') {
      throw new Error('UNSUPPORTED_PAYMENT_METHOD');
    }

    return paymentMethodRepository.upsertStripeMethod({
      userId,
      customerId,
      paymentMethodId: paymentMethod.id,
      brand: paymentMethod.card?.brand ?? null,
      last4: paymentMethod.card?.last4 ?? null,
      expiryMonth: paymentMethod.card?.exp_month ?? null,
      expiryYear: paymentMethod.card?.exp_year ?? null,
      billingName: paymentMethod.billing_details.name ?? null,
      billingEmail: paymentMethod.billing_details.email ?? null,
      isDefault: true
    });
  },

  async removePaymentMethod(userId: string, paymentMethodId: string) {
    const method = await paymentMethodRepository.findByIdForUser(paymentMethodId, userId);
    if (!method?.providerPaymentMethodId) {
      throw new Error('PAYMENT_METHOD_NOT_FOUND');
    }

    await stripeProvider.detachPaymentMethod(method.providerPaymentMethodId);
    await paymentMethodRepository.deleteForUser(paymentMethodId, userId);
  }
};
