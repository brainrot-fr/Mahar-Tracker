import type {
  EntryStatus,
  GoldPriceUnit,
  PermittedUkhiya,
  SupportedCurrency,
} from "./constants";

export type UnitConfig = {
  gramsPerTola: number;
  tolasPerUkhiya: number;
  troyOunceGrams: number;
};

export type AppSettings = UnitConfig & {
  permittedUkhiya: PermittedUkhiya[];
  purityLabel: string;
  purityFineness: number;
  defaultCurrency: string;
  supportedCurrencies: string[];
  manualPriceFallbackEnabled: boolean;
  providerPriority: string[];
  currentPriceCacheSeconds: number;
};

export type Goal = {
  id: string;
  userId: string;
  ukhiyaCount: PermittedUkhiya;
  goalType: "gold" | "cash";
  targetAmount: number;
  targetCurrency: string;
  tolasPerUkhiya: number;
  gramsPerTola: number;
  targetGrams: number;
  purityLabel: string;
  purityFineness: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  userId: string;
  preferredCurrency: SupportedCurrency | string;
  selectedProvider: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PriceQuote = {
  providerName: string;
  fallbackUsed: boolean;
  quoteDate: string;
  apiCurrency: string;
  goldPrice: number;
  goldPriceUnit: GoldPriceUnit;
  /** Price per gram in the API's currency. */
  normalizedPricePerGramApi: number;
  /** Deposited-currency units per 1 API-currency unit. */
  exchangeRate: number;
  exchangeRateTimestamp: string | null;
  /** Price per gram in the deposit currency — this is what grams are computed from. */
  pricePerGramInDepositCurrency: number;
  priceSourceTimestamp: string | null;
  manuallyEntered: boolean;
  fromCache: boolean;
  /** When Mahar Tracker last checked the provider or read the cached quote. */
  checkedAt: string | null;
};

export type QuoteFailure = {
  ok: false;
  reason: "unavailable" | "historical_unavailable" | "invalid" | "unsupported_currency";
  message: string;
  triedProviders: string[];
  manualFallbackEnabled: boolean;
};

export type QuoteSuccess = {
  ok: true;
  quote: PriceQuote;
};

export type QuoteResult = QuoteSuccess | QuoteFailure;

export type SavingsEntry = {
  id: string;
  userId: string;
  goalId: string;
  clientIdempotencyKey: string;
  depositDate: string;
  depositedAmount: number;
  depositedCurrency: string;
  apiCurrency: string;
  exchangeRate: number;
  exchangeRateTimestamp: string | null;
  goldPrice: number;
  goldPriceUnit: GoldPriceUnit;
  normalizedPricePerGram: number;
  completedGrams: number;
  providerName: string;
  fallbackUsed: boolean;
  priceSourceTimestamp: string | null;
  manuallyEnteredPrice: boolean;
  note: string | null;
  status: EntryStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type HistoryRow = SavingsEntry & {
  runningGrams: number;
  runningCompletionPercent: number;
  currentValue: number | null;
};

export type Dashboard = {
  goal: Goal;
  profile: Profile;
  settings: AppSettings;
  targetUkhiya: number;
  targetGrams: number;
  completedGrams: number;
  remainingGrams: number;
  completionPercent: number;
  totalDepositedByCurrency: { currency: string; amount: number }[];
  preferredCurrency: string;
  totalDepositedPreferred: number | null;
  currentPricePerGram: number | null;
  currentPriceCurrency: string | null;
  currentPriceProvider: string | null;
  currentPriceAsOf: string | null;
  currentPriceCheckedAt: string | null;
  currentEstimatedValue: number | null;
  estimatedValueDifference: number | null;
  entryCount: number;
  mostRecentDeposit: {
    id: string;
    depositDate: string;
    amount: number;
    currency: string;
    grams: number;
  } | null;
  averageEffectivePricePerGram: number | null;
  milestones: { percent: number; reached: boolean }[];
};

export type ProviderErrorKind =
  | "timeout"
  | "rate_limit"
  | "invalid_response"
  | "authentication"
  | "unavailable"
  | "unsupported"
  | "network";
