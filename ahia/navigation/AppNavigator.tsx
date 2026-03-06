// src/navigation/AppNavigator.tsx
// Ahia - Campus Marketplace | Navigation System
// Task 1: Complete Navigation Flow

import React, { useState, useEffect, createContext, useContext } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface Campus {
  id: string;
  name: string;
  subdomain: string;
  country: string;
  flag: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  campus: Campus | null;
  verificationStatus: VerificationStatus;
  studentIdUrl?: string;
  xrplWalletAddress?: string;
}

export type RootStackParamList = {
  // Auth Stack
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  CampusSelect: { fromRegistration?: boolean };
  StudentVerification: { campus: Campus };
  VerificationPending: undefined;
  VerificationRejected: { reason: string };

  // Main App Stack
  Main: { screen?: keyof TabParamList };
  Notifications: undefined;
  Settings: undefined;
  ProductDetail: { productId: string; campusSubdomain: string };
  SellerProfile: { sellerId: string };
  CreateListing: undefined;
  EditListing: { listingId: string };
  Chat: { chatId: string; recipientId: string; listingId?: string };
  ChatList: undefined;
  EscrowDetail: { transactionId: string };
};

export type TabParamList = {
  Home: undefined;
  Sell: undefined;
  Transactions: undefined;
  Profile: undefined;
};

// ─── Deep Link Configuration ─────────────────────────────────────────────────

/**
 * Deep link URL structure:
 * ahia://campus/{subdomain}/listing/{id}
 * ahia://campus/{subdomain}/profile/{userId}
 * ahia://transaction/{txId}
 * ahia://chat/{chatId}
 *
 * Web subdomain structure:
 * https://{campus}.ahia.app/listing/{id}
 * https://{campus}.ahia.app/profile/{userId}
 */

export const DEEP_LINK_CONFIG = {
  prefixes: [
    "ahia://",
    "https://ahia.app",
    "https://*.ahia.app", // campus subdomains
  ],
  config: {
    screens: {
      Main: {
        screens: {
          Home: "home",
          Sell: "sell",
          Transactions: "transactions",
          Profile: "profile",
        },
      },
      ProductDetail: {
        path: "campus/:campusSubdomain/listing/:productId",
      },
      SellerProfile: {
        path: "campus/:campusSubdomain/profile/:sellerId",
      },
      Chat: {
        path: "chat/:chatId",
      },
      EscrowDetail: {
        path: "transaction/:transactionId",
      },
    },
  },
};

// ─── Auth Context ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  submitVerification: (studentIdFile: File) => Promise<void>;
  refreshVerificationStatus: () => Promise<void>;
  connectWallet: (address: string) => Promise<void>;
  selectCampus: (campus: Campus) => Promise<void>;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
  campusId?: string;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// ─── Auth Provider ─────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from secure storage on mount
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      // In production: retrieve token from SecureStore / AsyncStorage
      // Validate token with backend and rehydrate user
      const storedUser = await AuthService.getStoredUser();
      if (storedUser) setUser(storedUser);
    } catch {
      // Session expired or invalid — stay logged out
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const authUser = await AuthService.login(email, password);
      setUser(authUser);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpData) => {
    setIsLoading(true);
    try {
      const authUser = await AuthService.register(data);
      setUser(authUser);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await AuthService.logout();
    setUser(null);
  };

  const submitVerification = async (studentIdFile: File) => {
    if (!user) return;
    await AuthService.submitVerification(user.id, studentIdFile);
    setUser((prev) => prev ? { ...prev, verificationStatus: "pending" } : prev);
  };

  const refreshVerificationStatus = async () => {
    if (!user) return;
    const status = await AuthService.checkVerificationStatus(user.id);
    setUser((prev) => prev ? { ...prev, verificationStatus: status } : prev);
  };

  const connectWallet = async (address: string) => {
    if (!user) return;
    await AuthService.linkWallet(user.id, address);
    setUser((prev) => prev ? { ...prev, xrplWalletAddress: address } : prev);
  };

  const selectCampus = async (campus: Campus) => {
    if (!user) return;
    await AuthService.updateCampus(user.id, campus);
    setUser((prev) => prev ? { ...prev, campus } : prev);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        submitVerification,
        refreshVerificationStatus,
        connectWallet,
        selectCampus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Protected Route Guard ────────────────────────────────────────────────────

interface RouteGuardProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireVerified = false,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <SplashScreen />;
  if (!isAuthenticated) return <AuthStack />;

  if (requireVerified) {
    switch (user?.verificationStatus) {
      case "unverified":
        return <StudentVerificationScreen />;
      case "pending":
        return <VerificationPendingScreen />;
      case "rejected":
        return <VerificationRejectedScreen reason="Document unclear" />;
      case "verified":
        return <>{children}</>;
      default:
        return <StudentVerificationScreen />;
    }
  }

  return <>{children}</>;
};

// ─── Root Navigator ────────────────────────────────────────────────────────────

/**
 * NAVIGATION TREE:
 *
 * RootNavigator
 * ├── AuthStack (unauthenticated)
 * │   ├── SplashScreen
 * │   ├── OnboardingScreen
 * │   ├── LoginScreen
 * │   ├── RegisterScreen
 * │   └── CampusSelectScreen
 * │
 * └── AppStack (authenticated)
 *     ├── VerificationStack (unverified/pending/rejected)
 *     │   ├── StudentVerificationScreen
 *     │   ├── VerificationPendingScreen
 *     │   └── VerificationRejectedScreen
 *     │
 *     └── MainStack (verified)
 *         ├── TabNavigator
 *         │   ├── HomeTab        → Campus-scoped feed
 *         │   ├── SellTab        → Create listing
 *         │   ├── TransactionsTab → Escrow history
 *         │   └── ProfileTab     → User profile / wallet
 *         │
 *         ├── ProductDetailScreen
 *         ├── SellerProfileScreen
 *         ├── ChatScreen
 *         ├── ChatListScreen
 *         ├── EscrowDetailScreen
 *         ├── NotificationsScreen
 *         └── SettingsScreen
 */

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <SplashScreen />;

  if (!isAuthenticated) return <AuthStack />;

  // Gate by verification status
  if (!user?.verificationStatus || user.verificationStatus === "unverified") {
    return <StudentVerificationScreen />;
  }
  if (user.verificationStatus === "pending") {
    return <VerificationPendingScreen />;
  }
  if (user.verificationStatus === "rejected") {
    return <VerificationRejectedScreen reason="ID could not be verified" />;
  }

  return <MainAppNavigator />;
};

// ─── Tab Navigator Config ──────────────────────────────────────────────────────

export const TAB_CONFIG = [
  {
    name: "Home" as const,
    label: "Discover",
    icon: "🏠",
    activeIcon: "🏠",
    requiresVerification: true,
    description: "Browse listings from your campus",
  },
  {
    name: "Sell" as const,
    label: "Sell",
    icon: "➕",
    activeIcon: "➕",
    requiresVerification: true,
    description: "List an item for sale",
  },
  {
    name: "Transactions" as const,
    label: "Orders",
    icon: "📦",
    activeIcon: "📦",
    requiresVerification: true,
    description: "Track your escrow transactions",
  },
  {
    name: "Profile" as const,
    label: "Profile",
    icon: "👤",
    activeIcon: "👤",
    requiresVerification: false,
    description: "Your account & wallet",
  },
];

// ─── Campus Subdomain Resolver ────────────────────────────────────────────────

export const resolveCampusFromSubdomain = (hostname: string): string | null => {
  // e.g. "unn.ahia.app" → "unn"
  const parts = hostname.split(".");
  if (parts.length >= 3 && parts[parts.length - 2] === "ahia") {
    return parts[0];
  }
  return null;
};

export const buildCampusUrl = (campus: Campus, path = ""): string => {
  return `https://${campus.subdomain}.ahia.app${path}`;
};

// ─── Stub Screens (replace with actual implementations) ───────────────────────

const SplashScreen = () => null;
const AuthStack = () => null;
const MainAppNavigator = () => null;
const StudentVerificationScreen = () => null;
const VerificationPendingScreen = () => null;
const VerificationRejectedScreen = (_: { reason: string }) => null;

// ─── Stub Service (replace with real API calls) ───────────────────────────────

const AuthService = {
  getStoredUser: async (): Promise<AuthUser | null> => null,
  login: async (_e: string, _p: string): Promise<AuthUser> => ({} as AuthUser),
  register: async (_d: SignUpData): Promise<AuthUser> => ({} as AuthUser),
  logout: async () => {},
  submitVerification: async (_id: string, _f: File) => {},
  checkVerificationStatus: async (_id: string): Promise<VerificationStatus> => "pending",
  linkWallet: async (_id: string, _addr: string) => {},
  updateCampus: async (_id: string, _c: Campus) => {},
};

export default RootNavigator;
