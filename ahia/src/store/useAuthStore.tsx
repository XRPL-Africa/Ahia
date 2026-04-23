import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";

interface User {
  id: string;
  name: string;
  email: string;
  campus: string;
  isVerified: boolean;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  lastLogin: number | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      lastLogin: null,

      login: (user, token) => {
        const now = Date.now();
        Cookies.set("ahia-session", token, { expires: 7 });
        set({ user, token, lastLogin: now });

        // Analytics — lazy import avoids circular dep at module load time
        import("@/services/analytics.service").then(({ default: Analytics }) => {
          Analytics.identify(user.id);
          Analytics.trackLogin("email", user.campus);
        });
      },

      logout: () => {
        Cookies.remove("ahia-session");

        import("@/services/analytics.service").then(({ default: Analytics }) => {
          Analytics.trackLogout();
        });

        set({ user: null, token: null, lastLogin: null });
      },
    }),
    {
      name: "ahia-auth-storage",
      onRehydrateStorage: () => (state) => {
        if (state?.lastLogin) {
          const isExpired = Date.now() - state.lastLogin > SEVEN_DAYS_MS;
          if (isExpired) {
            state.logout();
          } else if (state.user) {
            // Track session restore
            import("@/services/analytics.service").then(({ default: Analytics }) => {
              Analytics.identify(state.user!.id);
              Analytics.track("session_restored", { campus: state.user!.campus });
            });
          }
        }
      },
    }
  )
);
