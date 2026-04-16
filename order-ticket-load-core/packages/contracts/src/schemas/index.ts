import { z } from 'zod';

export const AddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2),
});

export const GeoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const QuantitySchema = z.object({
  amount: z.number().positive(),
  unit: z.enum(['M3', 'CY']),
});

export const CreateCustomerSchema = z.object({
  externalId: z.string().nullish(),
  name: z.string().min(1),
  contactEmail: z.string().email().nullish(),
  contactPhone: z.string().nullish(),
  billingAddress: AddressSchema.nullish(),
});

export const CreateSiteSchema = z.object({
  customerId: z.string().uuid(),
  name: z.string().min(1),
  address: AddressSchema,
  geoPoint: GeoPointSchema.nullish(),
  geofenceRadiusMeters: z.number().int().positive().nullish(),
  notes: z.string().nullish(),
});

export const CreateJobSchema = z.object({
  customerId: z.string().uuid(),
  siteId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullish(),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
});

export const CreateMixDesignSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullish(),
  strengthPsi: z.number().int().positive().nullish(),
  slumpInches: z.number().positive().nullish(),
  version: z.number().int().positive().default(1),
});

export const CreateOrderSchema = z.object({
  externalId: z.string().nullish(),
  customerId: z.string().uuid(),
  jobId: z.string().uuid(),
  mixDesignId: z.string().uuid(),
  requestedQuantity: QuantitySchema,
  requestedDeliveryDate: z.string(),
  requestedDeliveryTime: z.string().nullish(),
  specialInstructions: z.string().nullish(),
});

export const CreateTicketSchema = z.object({
  orderId: z.string().uuid(),
  ticketNumber: z.string().min(1),
  scheduledDate: z.string(),
  plantId: z.string().nullish(),
  notes: z.string().nullish(),
});

export const CreateLoadSchema = z.object({
  ticketId: z.string().uuid(),
  truckId: z.string().nullish(),
  driverId: z.string().nullish(),
  mixDesignId: z.string().uuid(),
  actualQuantity: QuantitySchema.nullish(),
});

export const RecordDeliveryEventSchema = z.object({
  eventId: z.string().min(1),
  loadId: z.string().uuid(),
  state: z.enum([
    'PLANT_DEPARTED',
    'GEOFENCE_ENTERED',
    'ON_SITE_ARRIVED',
    'POUR_STARTED',
    'POUR_COMPLETED',
    'SITE_DEPARTED',
    'PLANT_RETURNED',
    'WASHOUT_COMPLETED',
  ]),
  occurredAt: z.string().datetime(),
  source: z.string().min(1),
  sourceEventId: z.string().nullish(),
  payload: z.record(z.unknown()).nullish(),
});
