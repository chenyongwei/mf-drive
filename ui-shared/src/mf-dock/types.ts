import type {
  AppId,
  LaunchMode,
  OntologyDataDomainV1,
  OntologyPurposeV1,
  OntologyRetentionV1,
  OntologyRevocationModeV1,
} from '@platform/contracts/generated/apps';

export type {
  AppId,
  LaunchMode,
  OntologyDataDomainV1,
  OntologyPurposeV1,
  OntologyRetentionV1,
  OntologyRevocationModeV1,
};

export type DockInstallStep = 'manage' | 'account_auth' | 'base_auth' | 'connect_auth' | 'done';

export type AppCatalogItem = {
  appId: AppId;
  name: string;
  route: string;
  clientId: string;
  enabledByUser: boolean;
  requiredBaseScope: string;
  /** @deprecated Pair-scope field retained for compatibility only. */
  connectScope: string;
  /** @deprecated Pair-scope field retained for compatibility only. */
  connectGranted: boolean;
  /** @deprecated Pair-scope field retained for compatibility only. */
  requiresConnectScope: boolean;
  policyGranted?: boolean;
  activePolicyCount?: number;
  recommendedTemplate?: {
    dataDomain: OntologyDataDomainV1;
    purpose: OntologyPurposeV1;
    retention: OntologyRetentionV1;
    revocationMode: OntologyRevocationModeV1;
  };
  launchMode: LaunchMode;
  miniSupported: boolean;
  installedAt?: string;
};

export type AppsCatalogResponse = {
  accountAuthorized: boolean;
  accountAuthorizedAt?: string;
  items: AppCatalogItem[];
  total: number;
};

export type AuthTokenResult = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

export type AppInstallSession = {
  sourceAppId: AppId;
  targetAppId: AppId;
  policyId?: string;
  sourceGrantId?: string;
  targetGrantId?: string;
  accessToken?: string;
  approvedScopes: string[];
  introspectActive: boolean;
};

export type MiniLaunchSession = {
  targetAppId: AppId;
  targetRoute: string;
  title: string;
};

export type MarketplaceAppItem = {
  appId: AppId;
  name: string;
  route: string;
  clientId: string;
  enabledByUser: boolean;
  requiredBaseScope: string;
  connectScope: string;
  connectGranted: boolean;
  requiresConnectScope: boolean;
  policyGranted?: boolean;
  activePolicyCount?: number;
  recommendedTemplate?: {
    dataDomain: OntologyDataDomainV1;
    purpose: OntologyPurposeV1;
    retention: OntologyRetentionV1;
    revocationMode: OntologyRevocationModeV1;
  };
  launchMode: LaunchMode;
  miniSupported: boolean;
  installedAt?: string;
  category: string;
  tagline: string;
  shortDescription: string;
  tags: string[];
  highlights: string[];
  updatedAt: string;
  ratingAverage: number;
  ratingCount: number;
  installCount: number;
  featured: boolean;
};

export type MarketplaceCatalogResponse = {
  accountAuthorized: boolean;
  accountAuthorizedAt?: string;
  items: MarketplaceAppItem[];
  total: number;
  page: number;
  pageSize: number;
  categories: Array<{
    key: string;
    label: string;
    count: number;
  }>;
};

export type MarketplaceAppDetailResponse = {
  accountAuthorized: boolean;
  accountAuthorizedAt?: string;
  app: MarketplaceAppItem & {
    longDescription: string;
    screenshots: string[];
    version: string;
    permissionScopes: string[];
    permissionsSummary: string;
  };
};
