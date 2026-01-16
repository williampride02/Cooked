import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import {
  useDeepLinking,
  parseDeepLink,
  createDeepLink,
  ParsedDeepLink,
  DeepLinkRoute,
} from '@/hooks/useDeepLinking';
import { useAppStore } from '@/stores/app';

/**
 * Context value for deep linking
 */
interface DeepLinkContextValue {
  /**
   * The most recent deep link that was received
   */
  lastDeepLink: ParsedDeepLink | null;
  /**
   * Navigate to a deep link URL
   */
  navigateToUrl: (url: string | null) => void;
  /**
   * Parse a URL into deep link data without navigating
   */
  parseUrl: (url: string) => ParsedDeepLink | null;
  /**
   * Create a shareable deep link URL
   */
  createShareableLink: (route: DeepLinkRoute, useUniversalLink?: boolean) => string;
  /**
   * Pending invite code from a join link (for join-group screen)
   */
  pendingInviteCode: string | null;
  /**
   * Clear the pending invite code
   */
  clearPendingInviteCode: () => void;
  /**
   * Pending deep link to process after authentication
   */
  pendingAuthDeepLink: ParsedDeepLink | null;
  /**
   * Process and clear the pending auth deep link
   */
  processPendingAuthDeepLink: () => void;
}

const DeepLinkContext = createContext<DeepLinkContextValue | null>(null);

interface DeepLinkProviderProps {
  children: ReactNode;
}

/**
 * Provider component that initializes deep linking and provides context
 *
 * Wrap your app with this provider in the root layout to enable deep linking:
 *
 * ```tsx
 * <DeepLinkProvider>
 *   <App />
 * </DeepLinkProvider>
 * ```
 *
 * Supported deep link patterns:
 * - cooked://group/{id} - Open group feed
 * - cooked://group/{id}/roast/{threadId} - Open roast thread
 * - cooked://group/{id}/pact/{pactId} - Open pact details
 * - cooked://join/{inviteCode} - Join group via invite code
 * - cooked://recap/{recapId} - Open weekly recap
 *
 * Universal links (https://cooked.app/...) follow the same patterns.
 */
export function DeepLinkProvider({ children }: DeepLinkProviderProps) {
  const [lastDeepLink, setLastDeepLink] = useState<ParsedDeepLink | null>(null);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const [pendingAuthDeepLink, setPendingAuthDeepLink] = useState<ParsedDeepLink | null>(null);

  const session = useAppStore((state) => state.session);
  const isAuthenticated = !!session;

  const handleDeepLink = useCallback((parsed: ParsedDeepLink) => {
    setLastDeepLink(parsed);

    // Extract invite code from join links for use in join-group screen
    if (parsed.params.inviteCode) {
      setPendingInviteCode(parsed.params.inviteCode);
    }

    // If user is not authenticated, store deep link for later processing
    // Join links can be accessed without auth (will redirect after login)
    if (!isAuthenticated && parsed.route.includes('/(main)')) {
      console.log('Storing deep link for after authentication:', parsed.route);
      setPendingAuthDeepLink(parsed);
    }
  }, [isAuthenticated]);

  const { navigateToUrl, parseUrl } = useDeepLinking({
    onDeepLink: handleDeepLink,
    // Only auto-navigate if authenticated or if it's a join link
    autoNavigate: true,
  });

  const createShareableLink = useCallback(
    (route: DeepLinkRoute, useUniversalLink = true) => {
      return createDeepLink(route, { useUniversalLink });
    },
    []
  );

  const clearPendingInviteCode = useCallback(() => {
    setPendingInviteCode(null);
  }, []);

  const processPendingAuthDeepLink = useCallback(() => {
    if (pendingAuthDeepLink) {
      console.log('Processing pending auth deep link:', pendingAuthDeepLink.route);
      navigateToUrl(pendingAuthDeepLink.originalUrl);
      setPendingAuthDeepLink(null);
    }
  }, [pendingAuthDeepLink, navigateToUrl]);

  // Auto-process pending deep link when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && pendingAuthDeepLink) {
      // Small delay to ensure navigation is ready
      const timer = setTimeout(() => {
        processPendingAuthDeepLink();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, pendingAuthDeepLink, processPendingAuthDeepLink]);

  return (
    <DeepLinkContext.Provider
      value={{
        lastDeepLink,
        navigateToUrl,
        parseUrl,
        createShareableLink,
        pendingInviteCode,
        clearPendingInviteCode,
        pendingAuthDeepLink,
        processPendingAuthDeepLink,
      }}
    >
      {children}
    </DeepLinkContext.Provider>
  );
}

/**
 * Hook to access deep linking context
 * Must be used within a DeepLinkProvider
 */
export function useDeepLinkContext(): DeepLinkContextValue {
  const context = useContext(DeepLinkContext);
  if (!context) {
    throw new Error('useDeepLinkContext must be used within a DeepLinkProvider');
  }
  return context;
}

/**
 * Hook to get the pending invite code from a deep link
 * Useful for the join-group screen to auto-fill the invite code
 *
 * @example
 * ```tsx
 * function JoinGroupScreen() {
 *   const { inviteCode, clearInviteCode } = usePendingInviteCode();
 *
 *   useEffect(() => {
 *     if (inviteCode) {
 *       setInviteInput(inviteCode);
 *       clearInviteCode();
 *     }
 *   }, [inviteCode]);
 * }
 * ```
 */
export function usePendingInviteCode() {
  const { pendingInviteCode, clearPendingInviteCode } = useDeepLinkContext();
  return {
    inviteCode: pendingInviteCode,
    clearInviteCode: clearPendingInviteCode,
  };
}

/**
 * Hook to create shareable deep links
 *
 * @example
 * ```tsx
 * function ShareButton({ groupId, pactId }) {
 *   const { createLink } = useShareableLink();
 *
 *   const handleShare = async () => {
 *     const link = createLink({ type: 'pact', groupId, pactId });
 *     await Share.share({ message: `Check out this pact! ${link}` });
 *   };
 * }
 * ```
 */
export function useShareableLink() {
  const { createShareableLink } = useDeepLinkContext();
  return {
    createLink: createShareableLink,
    /**
     * Create a direct group link
     */
    createGroupLink: (groupId: string) =>
      createShareableLink({ type: 'group', groupId }, true),
    /**
     * Create a group invite link
     */
    createGroupInviteLink: (inviteCode: string) =>
      createShareableLink({ type: 'join', inviteCode }, true),
    /**
     * Create a pact share link
     */
    createPactLink: (groupId: string, pactId: string) =>
      createShareableLink({ type: 'pact', groupId, pactId }, true),
    /**
     * Create a roast thread link
     */
    createRoastLink: (groupId: string, threadId: string) =>
      createShareableLink({ type: 'roast', groupId, threadId }, true),
    /**
     * Create a recap link (with group context for better navigation)
     */
    createRecapLink: (recapId: string, groupId?: string) =>
      groupId
        ? `https://cooked.app/group/${groupId}/recap/${recapId}`
        : createShareableLink({ type: 'recap', recapId }, true),
  };
}
