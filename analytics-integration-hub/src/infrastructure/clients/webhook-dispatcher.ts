import { createHmac } from 'crypto';

export interface WebhookPayload {
  eventId: string;
  eventType: string;
  source: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export interface DispatchResult {
  success: boolean;
  httpStatus: number | null;
  responseBody: string | null;
}

export function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export async function dispatchWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string,
): Promise<DispatchResult> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': payload.eventType,
        'X-Webhook-Id': payload.eventId,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });

    const responseBody = await response.text().catch(() => null);

    return {
      success: response.ok,
      httpStatus: response.status,
      responseBody: responseBody?.slice(0, 2000) ?? null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      httpStatus: null,
      responseBody: message,
    };
  }
}
