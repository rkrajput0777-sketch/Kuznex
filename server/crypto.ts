import { ethers } from "ethers";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY not configured");
  return crypto.createHash("sha256").update(key).digest();
}

export function encryptPrivateKey(privateKey: string): string {
  const encKey = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encKey, iv);
  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return iv.toString("hex") + ":" + tag.toString("hex") + ":" + encrypted;
}

export function decryptPrivateKey(encryptedData: string): string {
  const encKey = getEncryptionKey();
  const parts = encryptedData.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted data format");
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, encKey, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function generateDepositWallet(): { address: string; privateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

export function generateDepositWalletForUser(): { address: string; encryptedKey: string } {
  const { address, privateKey } = generateDepositWallet();
  let encryptedKey: string;
  try {
    encryptedKey = encryptPrivateKey(privateKey);
  } catch {
    encryptedKey = "";
  }
  return { address, encryptedKey };
}

export const NETWORK_CONFIRMATIONS: Record<string, number> = {
  bsc: 12,
  polygon: 12,
  ethereum: 12,
};

export function getRequiredConfirmations(network: string): number {
  return NETWORK_CONFIRMATIONS[network] || 12;
}
