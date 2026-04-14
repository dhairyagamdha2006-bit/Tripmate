import type {
  AgentMessageRole,
  AgentMessageType,
  BookingItemStatus,
  BookingItemType,
  BookingStatus,
  CabinClass,
  PackageLabel,
  TripRequestStatus,
  SeatPreference,
  SmokingPreference,
  BedType
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
};

export type NormalizedBookingItem = {
  type: BookingItemType;
  status: BookingItemStatus;
  provider: string;
  providerReference?: string;
  displayName: string;
  amountCents: number;
  currency: string;
  details?: Record<string, unknown>;
};

export type BookingRequestPayload = {
  tripId: string;
  tripRequestId: string;
  packageId: string;
  travelerName: string;
  travelerEmail: string;
};

export type BookingProviderResult = {
  success: boolean;
  confirmationNumber?: string;
  items: NormalizedBookingItem[];
  cancellationDeadline?: string;
  failureReason?: string;
};

export type PaymentAuthorizationInput = {
  userId: string;
  amountCents: number;
  currency: string;
  paymentMethodId: string;
  description: string;
};

export type PaymentAuthorizationResult = {
  success: boolean;
  providerReference?: string;
  failureReason?: string;
};

export type NotificationPayload = {
  to: string;
  subject: string;
  body: string;
};

export type FlightView = {
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
  refundable: boolean;
  cabinClass: CabinClass;
  loyaltyProgram?: string | null;
  returnFlightNumber?: string | null;
  returnDepartureTime?: string | null;
  returnArrivalTime?: string | null;
  returnDurationMinutes?: number | null;
  returnStops?: number | null;
};

export type HotelView = {
  name: string;
  stars: number;
  neighborhood?: string | null;
  city: string;
  address: string;
  nights: number;
  rating?: number | null;
  reviewCount?: number | null;
  amenities: string[];
  refundable: boolean;
  cancellationDeadline?: string | null;
  roomType?: string | null;
  bedType?: BedType | null;
  distanceToCenterKm?: number | null;
  totalPriceCents: number;
  pricePerNightCents: number;
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
  flight: FlightView;
  hotel: HotelView;
};

export type AgentMessageView = {
  id: string;
  role: AgentMessageRole;
  type: AgentMessageType;
  content: string;
  createdAt: string;
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

export type BookingSummaryView = {
  id: string;
  confirmationNumber?: string | null;
  status: BookingStatus;
  totalPriceCents: number;
  currency: string;
  bookedAt?: string | null;
  cancellationDeadline?: string | null;
  items: {
    id: string;
    type: BookingItemType;
    status: BookingItemStatus;
    displayName: string;
    amountCents: number;
    providerReference?: string | null;
  }[];
};

export type TripDetailView = {
  id: string;
  title: string;
  originLabel: string;
  destinationLabel: string;
  departureDate: string;
  returnDate: string;
  travelerCount: number;
  status: TripRequestStatus;
  selectedPackageId?: string | null;
  requestId: string;
  budgetCents: number;
  currency: string;
  flightOptionsCount: number;
  hotelOptionsCount: number;
  packages: PackageView[];
  agentMessages: AgentMessageView[];
  booking?: BookingSummaryView | null;
};

export type TravelerProfileFormData = {
  fullLegalName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  homeAirportCode: string;
  preferredCabinClass: CabinClass;
  seatPreference: SeatPreference;
  preferDirectFlights: boolean;
  preferredHotelChains: string[];
  bedType?: BedType | null;
  smokingPreference: SmokingPreference;
  accessibilityNeeds: string[];
  loyaltyPrograms: { program: string; memberId: string }[];
};

export type NotificationPayload = {
  toEmail: string;
  toName: string;
  subject: string;
  templateData?: {
    message?: string;
    details?: Record<string, string>;
    ctaUrl?: string;
    ctaLabel?: string;
    [key: string]: unknown;
  };
};
