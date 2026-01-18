/**
 * revenuecat-webhook Edge Function
 *
 * Receives RevenueCat webhook events and syncs group subscription status
 * into `public.groups` (subscription_status, subscription_expires_at).
 *
 * We use RevenueCat `app_user_id` format: `group:<groupId>`
 *
 * Security:
 * - This function should be deployed with verify_jwt = false.
 * - Validate Authorization header against Deno secret REVENUECAT_WEBHOOK_AUTH.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';
import {
  handleCorsPreflightRequest,
  createJsonResponse,
  createErrorResponse,
} from '../_shared/cors.ts';

type RevenueCatWebhook = {
  event?: {
    type?: string;
    app_user_id?: string;
    original_app_user_id?: string;
    expiration_at_ms?: number | null;
    grace_period_expiration_at_ms?: number | null;
    environment?: string;
    store?: string;
    id?: string;
  };
};

function extractGroupId(appUserId: string | undefined): string | null {
  if (!appUserId) return null;
  const prefix = 'group:';
  if (!appUserId.startsWith(prefix)) return null;
  const groupId = appUserId.slice(prefix.length);
  // loose UUID check
  if (!/^[0-9a-fA-F-]{36}$/.test(groupId)) return null;
  return groupId;
}

function msToIso(ms: number | null | undefined): string | null {
  if (!ms || typeof ms !== 'number') return null;
  return new Date(ms).toISOString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const expected = Deno.env.get('REVENUECAT_WEBHOOK_AUTH') || '';
    const auth = req.headers.get('authorization') || '';
    if (!expected || auth !== `Bearer ${expected}`) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = (await req.json()) as RevenueCatWebhook;
    const event = body.event;

    const groupId = extractGroupId(event?.app_user_id || event?.original_app_user_id);
    if (!groupId) {
      // For non-group events, acknowledge but do nothing.
      return createJsonResponse({ success: true, ignored: true, reason: 'No group app_user_id' });
    }

    const nowMs = Date.now();
    const expirationMs =
      typeof event?.expiration_at_ms === 'number' ? event.expiration_at_ms : null;
    const graceMs =
      typeof event?.grace_period_expiration_at_ms === 'number'
        ? event.grace_period_expiration_at_ms
        : null;

    // Determine active status
    const effectiveExpiryMs = graceMs ?? expirationMs;
    const hasFutureExpiry = typeof effectiveExpiryMs === 'number' && effectiveExpiryMs > nowMs;

    let status: 'free' | 'premium' | 'trial' = 'free';
    if (hasFutureExpiry) {
      status = 'premium';
    } else {
      // Some events (like INITIAL_PURCHASE) may not include expiration_at_ms in edge cases;
      // treat these as premium and let later webhooks correct.
      const t = (event?.type || '').toUpperCase();
      if (['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'SUBSCRIPTION_EXTENDED'].includes(t)) {
        status = 'premium';
      }
    }

    // Expiration events mean it should be free.
    if ((event?.type || '').toUpperCase() === 'EXPIRATION') {
      status = 'free';
    }

    const expiresAt = msToIso(effectiveExpiryMs);

    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from('groups')
      .update({
        subscription_status: status,
        subscription_expires_at: expiresAt,
      })
      .eq('id', groupId);

    if (error) {
      console.error('[revenuecat-webhook] Update group error:', error);
      return createErrorResponse('Failed to update group subscription', 500);
    }

    return createJsonResponse({
      success: true,
      group_id: groupId,
      event_type: event?.type,
      subscription_status: status,
      subscription_expires_at: expiresAt,
    });
  } catch (error) {
    console.error('revenuecat-webhook error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});

