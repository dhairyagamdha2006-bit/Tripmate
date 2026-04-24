import type {
  AgentMessageRole,
  AgentMessageType,
  BedType,
  BookingItemStatus,
  BookingItemType,
  BookingStatus,
  CabinClass,
  FulfillmentStatus,
  PackageLabel,
  PaymentStatus,
  TripRequestStatus,
  SeatPreference,
  SmokingPreference
} from '@prisma/client';

export type PackageScore = {
  overall: number;
  priceFit: number;
  convenience: number;
  travelDuration: number;
  hotelQuality: number;
  refundFlexibility: number;
  preferenceMatch: number;
};

export type FlightSearchInput = {
  originCode: string;
  destinationCode: string;
  departureDate: string;
  returnDate: string;
  travelerCount: number;
  cabinClass: CabinClass;
  preferDirectFlights: boolean;
  refundableOnly: boolean;
  currency: string;
};

export type NormalizedFlightOffer = {
  provider: string;
  providerOfferId: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  originCode: string;
  destinationCode: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  stopDetails: string[];
  cabinClass: CabinClass;
  priceCents: number;
  currency: string;
  refundable: boolean;
  changeable: boolean;
  baggageIncluded: boolean;
  seatsAvailable?: number;
  loyaltyProgram?: string;
  returnFlightNumber?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  returnDurationMinutes?: number;
  returnStops?: number;
  expiresAt?: string;
  offerJson?: Record<string, unknown>;
};

export type HotelSearchInput = {
  destinationCity: string;
  destinationCode: string;
  checkInDate: string;
  checkOutDate: string;
  travelerCount: number;
  minStars: number;
  neighborhoodPreference?: string | null;
  amenities: string[];
  refundableOnly: boolean;
  currency: string;
};

export type NormalizedHotelOffer = {
  provider: string;
  providerHotelId: string;
  providerOfferId: string;
  name: string;
  chain?: string;
  stars: number;
  neighborhood?: string;
  city: string;
  countryCode: string;
  address: string;
  latitude?: number;
  longitude?: number;
  pricePerNightCents: number;
  totalPriceCents: number;
  nights: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
  amenities: string[];
  refundable: boolean;
  cancellationDeadline?: string;
  roomType?: string;
  bedType?: BedType;
  distanceToCenterKm?: number;
  expiresAt?: string;
  offerJson?: Record<string, unknown>;
};

export type RecommendationNarrative = {
  explanation: string;
  highlights: string[];
  warnings: string[];
};

export type AgentMessageView = {
  id: string;
  role: AgentMessageRole;
  type: AgentMessageType;
  content: string;
  createdAt: string;
};

export type BookingSummaryView = {
  id: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  totalPriceCents: number;
  currency: string;
  confirmationNumber?: string | null;
  cancellationDeadline?: string | null;
  paymentIntentId?: string | null;
  providerBookingState?: string | null;
  items: {
    id: string;
    type: BookingItemType;
    status: BookingItemStatus;
    displayName: string;
    amountCents: number;
    providerReference?: string | null;
  }[];
};

export type PackageView = {
  id: string;
  label: PackageLabel;
  recommended: boolean;
  explanation: string;
  highlights: string[];
  warnings: string[];
  totalPriceCents: number;
  currency: string;
  score: PackageScore;
  flight: {
    airline: string;
    flightNumber: string;
    airlineCode: string;
    departureTime: string;
    arrivalTime: string;
    durationMinutes: number;
    stops: number;
    refundable: boolean;
    originCode: string;
    destinationCode: string;
    returnFlightNumber?: string | null;
    returnDepartureTime?: string | null;
    returnArrivalTime?: string | null;
    returnDurationMinutes?: number | null;
    returnStops?: number | null;
  };
  hotel: {
    name: string;
    stars: number;
    address: string;
    city: string;
    refundable: boolean;
    nights: number;
    totalPriceCents: number;
    rating?: number | null;
    reviewCount?: number | null;
    cancellationDeadline?: string | null;
    distanceToCenterKm?: number | null;
    roomType?: string | null;
  };
};

export type TripCardView = {
  id: string;
  title: string;
  originLabel: string;
  destinationLabel: string;
  departureDate: string;
  returnDate: string;
  travelerCount: number;
  status: TripRequestStatus;
  bookingStatus?: BookingStatus | null;
  totalPriceCents?: number | null;
};

export type NotificationPayload = {
  toEmail: string;
  toName?: string;
  subject: string;
  html?: string;
  text?: string;
  dynamicTemplateId?: string;
  templateData?: Record<string, unknown>;
};
