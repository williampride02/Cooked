import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import type { Group } from '@/types';

interface AppStore {
  // Auth state
  user: User | null;
  session: Session | null;

  // Current group
  currentGroup: Group | null;

  // UI state
  isCheckingIn: boolean;
  activeRoastThread: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setCurrentGroup: (group: Group | null) => void;
  setIsCheckingIn: (isCheckingIn: boolean) => void;
  setActiveRoastThread: (threadId: string | null) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  session: null,
  currentGroup: null,
  isCheckingIn: false,
  activeRoastThread: null,
};

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setCurrentGroup: (group) => set({ currentGroup: group }),
  setIsCheckingIn: (isCheckingIn) => set({ isCheckingIn }),
  setActiveRoastThread: (threadId) => set({ activeRoastThread: threadId }),
  reset: () => set(initialState),
}));
