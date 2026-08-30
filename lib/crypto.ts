import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// AES-256-GCM field-level encryption for sensitive profile data at rest
// (phone numbers, exact location). Output format: iv:authTag:ciphertext, all hex.

function getKey(): Buffer {
  const hex = process.env.FIELD_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "FIELD_ENCRYPTION_KEY must be set to a 32-byte (64 hex char) value"
    );
  }
  return Buffer.from(hex, "hex");
}

export function encryptField(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptField(encoded: string): string {
  const [ivHex, tagHex, dataHex] = encoded.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Malformed encrypted field");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
