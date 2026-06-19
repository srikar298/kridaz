import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SALT = "kridaz-encryption-salt";

const getEncryptionKey = () => {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error(
      "ENCRYPTION_SECRET is not defined in environment variables"
    );
  }
  return crypto.scryptSync(secret, SALT, 32);
};

export const encrypt = (text) => {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption failed", error);
    return text;
  }
};

export const decrypt = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== "string") return encryptedText;
  const parts = encryptedText.split(":");
  if (parts.length !== 3) return encryptedText;
  try {
    const [ivHex, authTagHex, contentHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(contentHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption failed", error);
    return encryptedText;
  }
};

export const isEncrypted = (text) => {
  if (!text || typeof text !== "string") return false;
  const parts = text.split(":");
  return parts.length === 3 && parts[0].length === 24 && parts[1].length === 32;
};
