import { Buffer } from "buffer";

/* ─────────────────────────────────────
   Helpers
───────────────────────────────────── */
function u64LE(value) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value));
  return buf;
}

function field32(value) {
  const buf = Buffer.alloc(32);
  const hex = BigInt(value).toString(16).padStart(64, "0");
  Buffer.from(hex, "hex").copy(buf);
  return buf;
}

/* ─────────────────────────────────────
   Deposit instruction
───────────────────────────────────── */
export function buildDepositData(commitment, amount, assetType) {
  return Buffer.concat([
    Buffer.from([0]),       // instruction = deposit
    field32(commitment),
    u64LE(amount),
    Buffer.from([assetType]),
  ]);
}

/* ─────────────────────────────────────
   Withdraw instruction
───────────────────────────────────── */
export function buildWithdrawData(root, nullifier, amount, assetType) {
  return Buffer.concat([
    Buffer.from([1]),       // instruction = withdraw
    field32(root),
    field32(nullifier),
    u64LE(amount),
    Buffer.from([assetType]),
  ]);
}
