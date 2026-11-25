import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/json",
  "video/mp4",
  "text/markdown",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".txt", ".json", ".mp4", ".md", ".har",
]);

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateUpload(filename: string, mimeType: string, size: number) {
  if (size <= 0 || size > MAX_UPLOAD_BYTES) {
    return { ok: false as const, error: "اندازه فایل باید بین ۱ بایت و ۱۰ مگابایت باشد" };
  }
  if (!ALLOWED_MIME.has(mimeType)) {
    return { ok: false as const, error: `نوع فایل ${mimeType} مجاز نیست` };
  }
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false as const, error: `پسوند ${ext || "(نامشخص)"} مجاز نیست` };
  }
  return { ok: true as const };
}

function sanitizeName(filename: string) {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function storageKey(filename: string) {
  return `${crypto.randomUUID()}-${sanitizeName(filename)}`;
}

const localDir = path.join(process.cwd(), "storage", "uploads");

async function putLocal(key: string, buffer: Buffer) {
  await fs.mkdir(localDir, { recursive: true });
  await fs.writeFile(path.join(localDir, key), buffer);
}

async function localReadObject(key: string) {
  const safeKey = path.basename(key);
  if (safeKey !== key) throw new Error("کلید ذخیره‌سازی نامعتبر است");
  return fs.readFile(path.join(localDir, safeKey));
}

function s3Client() {
  return new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: !!process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
}

export async function putObject(
  filename: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ ok: true; storageKey: string } | { ok: false; error: string }> {
  const check = validateUpload(filename, mimeType, buffer.byteLength);
  if (!check.ok) return check;

  const key = storageKey(filename);
  if (process.env.STORAGE_DRIVER === "s3") {
    const client = s3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ContentDisposition: "attachment",
        ServerSideEncryption: "AES256",
      })
    );
  } else {
    await putLocal(key, buffer);
  }
  return { ok: true, storageKey: key };
}

export async function getObjectUrl(storageKey: string, expiresIn = 300) {
  if (process.env.STORAGE_DRIVER === "s3") {
    const client = s3Client();
    return getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: storageKey,
        ResponseContentDisposition: "attachment",
      }),
      { expiresIn }
    );
  }
  return `/api/attachments/${storageKey}`;
}

export async function readObject(storageKey: string) {
  if (process.env.STORAGE_DRIVER === "s3") {
    const client = s3Client();
    const res = await client.send(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: storageKey })
    );
    const bytes = await res.Body?.transformToByteArray();
    return bytes ? Buffer.from(bytes) : null;
  }
  return localReadObject(storageKey);
}
