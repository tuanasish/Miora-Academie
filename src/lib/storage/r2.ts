import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const SPEAKING_UPLOAD_MAX_BYTES = 45 * 1024 * 1024;
export const SPEAKING_UPLOAD_MAX_MB = SPEAKING_UPLOAD_MAX_BYTES / 1024 / 1024;

const ALLOWED_SPEAKING_MIME_TYPES = new Set([
  "video/webm",
  "video/mp4",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
]);

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("R2_NOT_CONFIGURED");
  }

  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function createR2Client(config: R2Config) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export function normalizeSpeakingMimeType(mimeType: string) {
  return mimeType.split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
}

export function assertAllowedSpeakingUpload(input: {
  mimeType: string;
  sizeBytes: number;
}) {
  const mimeType = normalizeSpeakingMimeType(input.mimeType);

  if (!ALLOWED_SPEAKING_MIME_TYPES.has(mimeType)) {
    throw new Error("UNSUPPORTED_MEDIA_TYPE");
  }
  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    throw new Error("INVALID_FILE_SIZE");
  }
  if (input.sizeBytes > SPEAKING_UPLOAD_MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
}

export function extensionForSpeakingMimeType(mimeType: string) {
  const normalized = normalizeSpeakingMimeType(mimeType);
  if (normalized === "video/mp4") return "mp4";
  if (normalized === "audio/ogg") return "ogg";
  if (normalized === "audio/mp4") return "m4a";
  if (normalized === "audio/mpeg") return "mp3";
  if (normalized === "audio/wav") return "wav";
  return "webm";
}

export function buildSpeakingStoragePath(input: {
  userId: string;
  partieId: number;
  task: 2 | 3;
  mimeType: string;
}) {
  const ext = extensionForSpeakingMimeType(input.mimeType);
  return [
    "speaking",
    input.userId,
    String(input.partieId),
    `tache${input.task}_${Date.now()}_${crypto.randomUUID()}.${ext}`,
  ].join("/");
}

export async function createSpeakingUploadUrl(input: {
  storagePath: string;
  mimeType: string;
  expiresInSeconds?: number;
}) {
  const config = getR2Config();
  const client = createR2Client(config);
  const contentType = normalizeSpeakingMimeType(input.mimeType);

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: input.storagePath,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, {
    expiresIn: input.expiresInSeconds ?? 900,
  });
}

export async function uploadSpeakingObject(input: {
  storagePath: string;
  mimeType: string;
  body: Uint8Array;
}) {
  const config = getR2Config();
  const client = createR2Client(config);
  const contentType = normalizeSpeakingMimeType(input.mimeType);

  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: input.storagePath,
    ContentType: contentType,
    Body: input.body,
  }));
}

export async function createSpeakingPlaybackUrl(
  storagePath: string | null | undefined,
  expiresInSeconds = 7200,
) {
  if (!storagePath) return storagePath;
  const config = getR2Config();
  const client = createR2Client(config);
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: storagePath,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
