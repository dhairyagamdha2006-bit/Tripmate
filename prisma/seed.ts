import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

async function main() {
  const shouldSeed = process.env.SEED_SAMPLE_DATA === 'true';
  if (!shouldSeed) {
    console.log('Skipping sample data seed. Set SEED_SAMPLE_DATA=true to create a sample account.');
    return;
  }

  const email = (process.env.SEED_SAMPLE_EMAIL ?? 'demo@tripmate.local').toLowerCase();
  const password = process.env.SEED_SAMPLE_PASSWORD ?? 'Tripmate123!';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Sample user already exists: ${email}`);
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Demo',
      lastName: 'Traveler',
      name: 'Demo Traveler'
    }
  });

  await prisma.travelerProfile.create({
    data: {
      userId: user.id,
      fullLegalName: 'Demo Traveler',
      dateOfBirth: new Date('1995-05-20'),
      nationality: 'US',
      passportNumber: 'X0000000',
      passportExpiry: new Date('2030-05-20'),
      passportIssuingCountry: 'US',
      phoneNumber: '+1 555 0100',
      homeAirportCode: 'SFO',
      preferredCabinClass: 'ECONOMY',
      seatPreference: 'AISLE',
      preferDirectFlights: true,
      preferredHotelChains: [],
      smokingPreference: 'NON_SMOKING',
      accessibilityNeeds: []
    }
  });

  console.log('Created sample account');
  console.log(`email: ${email}`);
  console.log(`password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
