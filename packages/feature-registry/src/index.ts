/**
 * @ems/feature-registry — Package entry point
 *
 * Phase 1 stub: feature flag registry will be implemented in Phase 2+.
 * This package provides a centralized registry for feature flags and
 * module discovery across all EMS applications.
 */

/** Supported feature flag keys — extend in Phase 2+ */
export type FeatureKey = string & { readonly _brand: "FeatureKey" };

/** Feature flag definition */
export interface FeatureFlag {
  key: FeatureKey;
  enabled: boolean;
  description: string;
}

export {};
