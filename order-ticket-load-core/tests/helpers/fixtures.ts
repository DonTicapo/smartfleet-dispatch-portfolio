import { randomUUID } from 'crypto';

export function makeCustomer(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Test Customer',
    contact_email: 'test@example.com',
    contact_phone: '555-0199',
    billing_address: JSON.stringify({
      line1: '1 Test St',
      city: 'Testville',
      state: 'TX',
      postalCode: '75001',
      country: 'US',
    }),
    ...overrides,
  };
}

export function makeMixDesign(overrides: Record<string, unknown> = {}) {
  return {
    code: `MIX-${randomUUID().slice(0, 6)}`,
    name: 'Test Mix 3000',
    strength_psi: 3000,
    slump_inches: 4.0,
    version: 1,
    is_active: true,
    ...overrides,
  };
}

export function makeSite(customerId: string, overrides: Record<string, unknown> = {}) {
  return {
    customer_id: customerId,
    name: 'Test Site',
    address: JSON.stringify({
      line1: '2 Test Ave',
      city: 'Testville',
      state: 'TX',
      postalCode: '75002',
      country: 'US',
    }),
    geo_point: JSON.stringify({ latitude: 32.78, longitude: -96.8 }),
    geofence_radius_meters: 150,
    ...overrides,
  };
}

export function makeJob(customerId: string, siteId: string, overrides: Record<string, unknown> = {}) {
  return {
    customer_id: customerId,
    site_id: siteId,
    name: 'Test Job',
    description: 'Test job description',
    ...overrides,
  };
}

export function makeOrder(
  customerId: string,
  jobId: string,
  mixDesignId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    customer_id: customerId,
    job_id: jobId,
    mix_design_id: mixDesignId,
    requested_quantity_amount: 10.0,
    requested_quantity_unit: 'M3',
    requested_delivery_date: '2026-04-01',
    status: 'DRAFT',
    created_by: 'test-user',
    ...overrides,
  };
}

export function makeTicket(orderId: string, overrides: Record<string, unknown> = {}) {
  return {
    order_id: orderId,
    ticket_number: `TKT-${randomUUID().slice(0, 8)}`,
    status: 'CREATED',
    scheduled_date: '2026-04-01',
    created_by: 'test-user',
    ...overrides,
  };
}

export function makeLoad(ticketId: string, mixDesignId: string, overrides: Record<string, unknown> = {}) {
  return {
    ticket_id: ticketId,
    load_number: 1,
    mix_design_id: mixDesignId,
    status: 'SCHEDULED',
    ...overrides,
  };
}
