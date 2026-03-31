import { tripRepository } from '@/server/repositories/trip.repository';

export const tripService = {
  listTripsForUser(userId: string) {
    return tripRepository.listTripsByUserId(userId);
  },

  getTripForUser(userId: string, tripId: string) {
    return tripRepository.getTripByIdForUser(userId, tripId);
  },

  async selectPackage(userId: string, tripId: string, packageId: string) {
    const request = await tripRepository.getLatestRequestByTripId(userId, tripId);
    if (!request) {
      throw new Error('Trip request not found.');
    }

    const pkg = request.packages.find((item) => item.id === packageId);
    if (!pkg) {
      throw new Error('Package not found for this trip.');
    }

    await tripRepository.setSelectedPackage(request.id, packageId, 'PENDING_APPROVAL');
    await tripRepository.updateTripStatus(tripId, 'PENDING_APPROVAL');
    await tripRepository.createAgentMessage({
      tripRequestId: request.id,
      role: 'ASSISTANT',
      type: 'STATUS',
      content: 'Package selected. Review every detail before booking.'
    });
    await tripRepository.createAuditLog({
      userId,
      tripId,
      actorType: 'USER',
      action: 'package.selected',
      details: { packageId }
    });

    return pkg;
  }
};
