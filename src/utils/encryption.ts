import crypto from "crypto";

const algorithm = "aes-256-gcm";

const secret = process.env.ENCRYPTION_KEY!;

if (!secret) {
  throw new Error("ENCRYPTION_KEY missing");
}

const key = crypto
  .createHash("sha256")
  .update(secret)
  .digest();

export function encrypt(text: string): string {

  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(
    algorithm,
    key,
    iv
  );

  let encrypted =
    cipher.update(
      text,
      "utf8",
      "hex"
    );

  encrypted +=
    cipher.final("hex");

  const authTag =
    cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted
  ].join(":");
}

export function decrypt(
  encrypted: string
): string {

  const [
    ivHex,
    authTagHex,
    content
  ] = encrypted.split(":");

  const decipher =
    crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(ivHex, "hex")
    );

  decipher.setAuthTag(
    Buffer.from(authTagHex, "hex")
  );

  let decrypted =
    decipher.update(
      content,
      "hex",
      "utf8"
    );

  decrypted +=
    decipher.final("utf8");

  return decrypted;
}

export const encryptSeed = encrypt;

export const decryptSeed = decrypt;