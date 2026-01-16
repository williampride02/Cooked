import { useEffect, useCallback, useRef } from 'react';
import * as Linking from 'expo-linking';
import { router, Href, useRootNavigationState } from 'expo-router';
import { supabase } from '@/lib/supabase';

/**
 * Deep link route configuration
 * Maps URL paths to app routes
 */
export interface DeepLinkConfig {
  /**
   * Custom URL scheme (e.g., 'cooked://')
   */
  scheme: string;
  /**
   * Universal link domains
   */
  universalLinkDomains: string[];
}

/**
 * Parsed deep link data
 */
export interface ParsedDeepLink {
  /**
   * The route to navigate to
   */
  route: string;
  /**
   * Extracted parameters from the URL
   */
  params: Record<string, string>;
  /**
   * Original URL that was parsed
   */
  originalUrl: string;
  /**
   * Whether this is a custom scheme URL (cooked://) or universal link (https://)
   */
  isCustomScheme: boolean;
}

/**
 * Deep link route types for the Cooked app
 */
export type DeepLinkRoute =
  | { type: 'group'; groupId: string }
  | { type: 'roast'; groupId: string; threadId: string }
  | { type: 'pact'; groupId: string; pactId: string }
  | { type: 'join'; inviteCode: string }
  | { type: 'recap'; recapId: string; groupId?: string }
  | { type: 'unknown' };

const DEFAULT_CONFIG: DeepLinkConfig = {
  scheme: 'cooked',
  universalLinkDomains: ['cooked.app', 'www.cooked.app'],
};

/**
 * Parse a URL into a deep link route
 */
export function parseDeepLink(url: string): ParsedDeepLink | null {
  if (!url) return null;

  try {
    const parsed = Linking.parse(url);
    const isCustomScheme = parsed.scheme === DEFAULT_CONFIG.scheme;

    // Construct path from hostname and path segments
    // For custom scheme: cooked://group/123 -> hostname is 'group', path is '123'
    // For universal: https://cooked.app/group/123 -> hostname is 'cooked.app', path is '/group/123'
    let fullPath: string;

    if (isCustomScheme) {
      // Custom scheme: hostname is the first path segment
      fullPath = parsed.hostname
        ? `/${parsed.hostname}${parsed.path || ''}`
        : parsed.path || '';
    } else {
      // Universal link: use just the path
      fullPath = parsed.path || '';
    }

    // Ensure path starts with /
    if (!fullPath.startsWith('/')) {
      fullPath = `/${fullPath}`;
    }

    // Parse the path into a route and params
    const { route, params } = parsePathToRoute(fullPath);

    return {
      route,
      params,
      originalUrl: url,
      isCustomScheme,
    };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
}

/**
 * Parse URL path into route and parameters
 */
function parsePathToRoute(path: string): { route: string; params: Record<string, string> } {
  // Remove leading/trailing slashes and split
  const segments = path.replace(/^\/+|\/+$/g, '').split('/');
  const params: Record<string, string> = {};

  // Pattern: /group/{id}
  if (segments[0] === 'group' && segments.length >= 2) {
    const groupId = segments[1];
    params.id = groupId;

    // Pattern: /group/{id}/roast/{threadId}
    if (segments[2] === 'roast' && segments[3]) {
      params.threadId = segments[3];
      return { route: `/(main)/group/${groupId}/roast/${segments[3]}`, params };
    }

    // Pattern: /group/{id}/pact/{pactId}
    if (segments[2] === 'pact' && segments[3]) {
      params.pactId = segments[3];
      return { route: `/(main)/group/${groupId}/pact/${segments[3]}`, params };
    }

    // Pattern: /group/{id}/recap/{recapId}
    if (segments[2] === 'recap' && segments[3]) {
      params.recapId = segments[3];
      params.groupId = groupId;
      return { route: `/(main)/group/${groupId}/recap/${segments[3]}`, params };
    }

    // Pattern: /group/{id}
    return { route: `/(main)/group/${groupId}`, params };
  }

  // Pattern: /join/{inviteCode}
  if (segments[0] === 'join' && segments[1]) {
    params.inviteCode = segments[1];
    // For join links, navigate to join-group and pre-fill the code
    return { route: '/(main)/join-group', params };
  }

  // Pattern: /recap/{recapId} (standalone recap link)
  // These links require fetching the recap to get the groupId
  if (segments[0] === 'recap' && segments[1]) {
    params.recapId = segments[1];
    // Mark as standalone recap - will be resolved during navigation
    return { route: '/recap-standalone', params };
  }

  // Unknown route - default to main
  return { route: '/(main)', params };
}

/**
 * Get the deep link route type from parsed data
 */
export function getDeepLinkRouteType(parsed: ParsedDeepLink): DeepLinkRoute {
  const { params, route } = parsed;

  if (route.includes('/roast/') && params.id && params.threadId) {
    return { type: 'roast', groupId: params.id, threadId: params.threadId };
  }

  if (route.includes('/pact/') && params.id && params.pactId) {
    return { type: 'pact', groupId: params.id, pactId: params.pactId };
  }

  if ((route.includes('/recap/') || route === '/recap-standalone') && params.recapId) {
    // Return recap route with groupId if available
    return {
      type: 'recap',
      recapId: params.recapId,
      groupId: params.groupId || params.id,
    };
  }

  if (route.includes('/join-group') && params.inviteCode) {
    return { type: 'join', inviteCode: params.inviteCode };
  }

  if (route.includes('/group/') && params.id) {
    return { type: 'group', groupId: params.id };
  }

  return { type: 'unknown' };
}

interface UseDeepLinkingOptions {
  /**
   * Callback when a deep link is received
   */
  onDeepLink?: (parsed: ParsedDeepLink) => void;
  /**
   * Whether to automatically navigate on deep link
   * @default true
   */
  autoNavigate?: boolean;
  /**
   * Custom configuration for deep linking
   */
  config?: Partial<DeepLinkConfig>;
}

/**
 * Hook to handle deep links in the Cooked app
 *
 * Supports both custom URL scheme (cooked://) and universal links (https://cooked.app)
 *
 * URL Patterns:
 * - cooked://group/{id} - Open group feed
 * - cooked://group/{id}/roast/{threadId} - Open roast thread
 * - cooked://group/{id}/pact/{pactId} - Open pact details
 * - cooked://join/{inviteCode} - Join group via invite code
 * - cooked://recap/{recapId} - Open weekly recap
 *
 * Universal Links (same patterns):
 * - https://cooked.app/group/{id}
 * - https://cooked.app/group/{id}/roast/{threadId}
 * - etc.
 *
 * @example
 * ```tsx
 * useDeepLinking({
 *   onDeepLink: (parsed) => {
 *     console.log('Received deep link:', parsed);
 *   },
 * });
 * ```
 */
export function useDeepLinking(options: UseDeepLinkingOptions = {}) {
  const { onDeepLink, autoNavigate = true } = options;
  const navigationState = useRootNavigationState();
  const pendingDeepLink = useRef<ParsedDeepLink | null>(null);
  const hasHandledInitialUrl = useRef(false);

  /**
   * Navigate to a deep link route
   */
  const navigateToDeepLink = useCallback(async (parsed: ParsedDeepLink) => {
    const routeType = getDeepLinkRouteType(parsed);

    console.log('Navigating to deep link:', {
      route: parsed.route,
      params: parsed.params,
      type: routeType.type,
    });

    // Special handling for join links - use params to pre-fill
    if (routeType.type === 'join') {
      // Navigate to join-group with invite code as a query param
      // The join-group screen can read this from useLocalSearchParams
      router.navigate({
        pathname: '/(main)/join-group',
        params: { code: parsed.params.inviteCode },
      } as never);
      return;
    }

    // Special handling for standalone recap links
    if (routeType.type === 'recap') {
      const recapRoute = routeType as { type: 'recap'; recapId: string; groupId?: string };

      // If we have a groupId, navigate directly
      if (recapRoute.groupId) {
        router.navigate(`/(main)/group/${recapRoute.groupId}/recap/${recapRoute.recapId}` as Href);
        return;
      }

      // For standalone recap links, fetch the recap to get the groupId
      try {
        console.log('Fetching recap to resolve group:', recapRoute.recapId);
        const { data, error } = await supabase
          .from('weekly_recaps')
          .select('group_id')
          .eq('id', recapRoute.recapId)
          .single();

        if (error || !data) {
          console.warn('Could not fetch recap:', error);
          router.navigate('/(main)' as Href);
          return;
        }

        router.navigate(`/(main)/group/${data.group_id}/recap/${recapRoute.recapId}` as Href);
        return;
      } catch (err) {
        console.error('Error fetching recap for deep link:', err);
        router.navigate('/(main)' as Href);
        return;
      }
    }

    // Navigate to the parsed route
    router.navigate(parsed.route as Href);
  }, []);

  /**
   * Handle incoming URL
   */
  const handleUrl = useCallback((url: string | null) => {
    if (!url) return;

    const parsed = parseDeepLink(url);
    if (!parsed) {
      console.log('Could not parse deep link URL:', url);
      return;
    }

    console.log('Received deep link:', {
      url,
      route: parsed.route,
      params: parsed.params,
    });

    // Call the callback if provided
    onDeepLink?.(parsed);

    // Store for later if navigation isn't ready
    if (!navigationState?.key) {
      console.log('Navigation not ready, storing deep link for later');
      pendingDeepLink.current = parsed;
      return;
    }

    // Navigate if auto-navigate is enabled
    if (autoNavigate) {
      navigateToDeepLink(parsed);
    }
  }, [autoNavigate, navigationState?.key, navigateToDeepLink, onDeepLink]);

  // Process pending deep link when navigation becomes ready
  useEffect(() => {
    if (navigationState?.key && pendingDeepLink.current) {
      console.log('Processing pending deep link');
      const parsed = pendingDeepLink.current;
      pendingDeepLink.current = null;

      if (autoNavigate) {
        navigateToDeepLink(parsed);
      }
    }
  }, [navigationState?.key, autoNavigate, navigateToDeepLink]);

  // Handle initial URL (cold start)
  useEffect(() => {
    if (hasHandledInitialUrl.current) return;

    const handleInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('Handling initial deep link URL:', initialUrl);
        hasHandledInitialUrl.current = true;
        handleUrl(initialUrl);
      }
    };

    handleInitialUrl();
  }, [handleUrl]);

  // Listen for incoming URLs (app already open)
  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('Received URL event:', event.url);
      handleUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleUrl]);

  return {
    /**
     * Manually navigate to a deep link URL
     */
    navigateToUrl: handleUrl,
    /**
     * Parse a URL without navigating
     */
    parseUrl: parseDeepLink,
  };
}

/**
 * Generate a deep link URL for the app
 */
export function createDeepLink(
  routeType: DeepLinkRoute,
  options?: { useUniversalLink?: boolean }
): string {
  const useUniversal = options?.useUniversalLink ?? false;
  const baseUrl = useUniversal ? 'https://cooked.app' : 'cooked://';

  switch (routeType.type) {
    case 'group':
      return `${baseUrl}/group/${routeType.groupId}`;
    case 'roast':
      return `${baseUrl}/group/${routeType.groupId}/roast/${routeType.threadId}`;
    case 'pact':
      return `${baseUrl}/group/${routeType.groupId}/pact/${routeType.pactId}`;
    case 'join':
      return `${baseUrl}/join/${routeType.inviteCode}`;
    case 'recap':
      return `${baseUrl}/recap/${routeType.recapId}`;
    default:
      return baseUrl;
  }
}
