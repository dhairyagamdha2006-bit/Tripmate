import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

export const travelerProfileRepository = {
  getByUserId(userId: string) {
    return prisma.travelerProfile.findUnique({
      where: { userId },
      include: { loyaltyPrograms: true }
    });
  },

  async upsertByUserId(userId: string, data: Prisma.TravelerProfileUncheckedCreateInput & { loyaltyPrograms: { program: string; memberId: string }[] }) {
    const { loyaltyPrograms, ...profileData } = data;

    return prisma.$transaction(async (tx) => {
      const profile = await tx.travelerProfile.upsert({
        where: { userId },
        update: {
          fullLegalName: profileData.fullLegalName,
          dateOfBirth: profileData.dateOfBirth,
          nationality: profileData.nationality,
          passportNumber: profileData.passportNumber,
          passportExpiry: profileData.passportExpiry,
          homeAirportCode: profileData.homeAirportCode,
          preferredCabinClass: profileData.preferredCabinClass,
          seatPreference: profileData.seatPreference,
          preferDirectFlights: profileData.preferDirectFlights,
          preferredHotelChains: profileData.preferredHotelChains,
          bedType: profileData.bedType,
          smokingPreference: profileData.smokingPreference,
          accessibilityNeeds: profileData.accessibilityNeeds
        },
        create: {
          ...profileData,
          userId
        }
      });

      await tx.loyaltyProgram.deleteMany({ where: { profileId: profile.id } });
      if (loyaltyPrograms.length) {
        await tx.loyaltyProgram.createMany({
          data: loyaltyPrograms.map((item) => ({
            profileId: profile.id,
            program: item.program,
            memberId: item.memberId
          }))
        });
      }

      return tx.travelerProfile.findUnique({
        where: { id: profile.id },
        include: { loyaltyPrograms: true }
      });
    });
  }
};
