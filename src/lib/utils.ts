import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * SOLANA ADDRESS VALIDATION
 * 
 * Validates that a string is a properly formatted Solana public key.
 * This is a CRITICAL security check before sending funds.
 * 
 * Validation checks:
 * - Base58 character set (no 0, O, I, l to avoid confusion)
 * - Length between 32-44 characters (typical Solana address range)
 * - No whitespace or special characters
 * 
 * Note: This is a lightweight validation. For production, consider
 * using @solana/web3.js PublicKey.isOnCurve() for cryptographic validation.
 * 
 * @param address - The address to validate
 * @returns true if valid format, false otherwise
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }

  // Remove whitespace
  address = address.trim();

  // Check length (Solana addresses are 32-44 characters in base58)
  if (address.length < 32 || address.length > 44) {
    return false;
  }

  // Base58 character set (Bitcoin/Solana standard)
  // Excludes: 0 (zero), O (capital o), I (capital i), l (lowercase L)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  
  return base58Regex.test(address);
}
