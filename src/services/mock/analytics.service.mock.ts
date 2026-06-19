'use client';

import { AhiaEventName } from '../analytics.service';

class MockAnalyticsService {
  track(_name: AhiaEventName, _properties?: Record<string, unknown>): void {}
  trackScreen(_screen: string, _properties?: Record<string, unknown>): void {}
  trackError(_ctx: any): void {}
  trackLogin(_method: string, _campus: string): void {}
  trackLoginFailed(_reason: string): void {}
  trackSignupStarted(_campus: string): void {}
  trackSignupCompleted(_campus: string, _method: string): void {}
  trackLogout(): void {}
  trackVerificationSubmitted(_campus: string): void {}
  trackVerificationResult(_result: string, _campus: string): void {}
  trackListingViewed(_listingId: string, _category: string, _priceXRP: number, _campus: string): void {}
  trackListingCreated(_listingId: string, _category: string, _priceXRP: number): void {}
  trackSearch(_query: string, _resultCount: number, _campus: string): void {}
  trackFilter(_filterType: string, _value: string): void {}
  trackBidPlaced(_listingId: string, _amountXRP: number): void {}
  trackEscrowInitiated(_transactionId: string, _amountXRP: number, _campus: string): void {}
  trackEscrowCompleted(_transactionId: string, _amountXRP: number, _durationMs: number): void {}
  trackDisputeRaised(_transactionId: string, _reason: string): void {}
  trackChatOpened(_chatId: string, _context: string): void {}
  trackMessageSent(_chatId: string, _type: string): void {}
  trackWalletConnected(_addressPrefix: string): void {}
  trackOfframp(_stage: string, _amountXRP: number): void {}
  custom(_name: string, _properties?: Record<string, unknown>): void {}
  getBehaviorSnapshot() { return { sessionId: 'mock', duration: 0, screenPath: [], eventCounts: {}, funnels: {}, userId: null }; }
  init(_userId: string | null): () => void { return () => {}; }
  identify(_userId: string | null): void {}
  flush(): void {}
}

export default new MockAnalyticsService();
