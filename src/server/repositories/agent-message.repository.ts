import { AgentMessageRole, AgentMessageType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const agentMessageRepository = {
  listByTripRequest(tripRequestId: string) {
    return prisma.agentMessage.findMany({
      where: { tripRequestId },
      orderBy: { createdAt: 'asc' }
    });
  },

  create(input: {
    tripRequestId: string;
    role: AgentMessageRole;
    type: AgentMessageType;
    content: string;
    metadata?: Record<string, unknown>;
  }) {
    return prisma.agentMessage.create({
      data: {
        tripRequestId: input.tripRequestId,
        role: input.role,
        type: input.type,
        content: input.content,
        metadata: input.metadata
      }
    });
  }
};
