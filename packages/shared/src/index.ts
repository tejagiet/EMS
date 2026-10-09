/**
 * @ems/shared — Package entry point
 *
 * Phase 1 stub: shared utilities will be added in Phase 2+.
 * This package will contain runtime helpers, date utilities, formatters,
 * and other cross-platform utilities.
 */

/**
 * Returns true if value is not null or undefined.
 * Useful as a type guard with Array.filter.
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * No-op identity function — useful as a default transformer.
 */
export function identity<T>(value: T): T {
  return value;
}

export {};
