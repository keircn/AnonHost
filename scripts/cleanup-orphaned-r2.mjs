#!/usr/bin/env node

import postgres from "postgres";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";

function parseArgs(argv) {
  const args = {
    execute: false,
    prefix: "",
    limit: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--execute") {
      args.execute = true;
      continue;
    }

    if (arg === "--prefix") {
      args.prefix = argv[i + 1] || "";
      i += 1;
      continue;
    }

    if (arg === "--limit") {
      const raw = argv[i + 1];
      const parsed = Number.parseInt(raw || "", 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error("--limit must be a positive integer");
      }
      args.limit = parsed;
      i += 1;
      continue;
    }
  }

  return args;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalizePublicBase(url) {
  return url.replace(/\/$/, "");
}

function keyFromPublicUrl(url, publicBase) {
  if (!url || typeof url !== "string") {
    return null;
  }

  if (!url.startsWith(publicBase + "/")) {
    return null;
  }

  return url.slice(publicBase.length + 1);
}

function fileIdFromKey(key) {
  const last = key.split("/").pop();
  if (!last) {
    return null;
  }

  const dot = last.lastIndexOf(".");
  return dot > 0 ? last.slice(0, dot) : last;
}

async function listAllObjectKeys({ client, bucket, prefix, limit }) {
  const keys = [];
  let continuationToken = undefined;

  while (true) {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || undefined,
        ContinuationToken: continuationToken,
      }),
    );

    const batch = (response.Contents || []).map((item) => item.Key).filter(Boolean);
    keys.push(...batch);

    if (limit !== null && keys.length >= limit) {
      return keys.slice(0, limit);
    }

    if (!response.IsTruncated || !response.NextContinuationToken) {
      return keys;
    }

    continuationToken = response.NextContinuationToken;
  }
}

async function deleteKeysInBatches({ client, bucket, keys }) {
  const chunkSize = 1000;
  let deleted = 0;

  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);

    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((key) => ({ Key: key })),
          Quiet: true,
        },
      }),
    );

    deleted += chunk.length;
    console.log(`Deleted ${deleted}/${keys.length} objects`);
  }
}

async function main() {
  const { execute, prefix, limit } = parseArgs(process.argv.slice(2));

  const databaseUrl = requireEnv("DATABASE_URL");
  const accountId = requireEnv("R2_ACCOUNT_ID");
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");
  const bucket = requireEnv("R2_BUCKET_NAME");
  const publicBase = normalizePublicBase(requireEnv("R2_PUBLIC_URL"));

  const sql = postgres(databaseUrl, { prepare: false });

  try {
    const [mediaRows, imageRows] = await Promise.all([
      sql`select id, url from "Media"`,
      sql`select id, url from images`,
    ]);

    const protectedIds = new Set();
    const protectedKeys = new Set();

    for (const row of mediaRows) {
      if (row.id) {
        protectedIds.add(String(row.id));
      }
      const key = keyFromPublicUrl(row.url, publicBase);
      if (key) {
        protectedKeys.add(key);
      }
    }

    for (const row of imageRows) {
      if (row.id) {
        protectedIds.add(String(row.id));
      }
      const key = keyFromPublicUrl(row.url, publicBase);
      if (key) {
        protectedKeys.add(key);
      }
    }

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      maxAttempts: 2,
      useDualstackEndpoint: false,
    });

    const allBucketKeys = await listAllObjectKeys({
      client,
      bucket,
      prefix,
      limit,
    });

    const orphanedKeys = [];

    for (const key of allBucketKeys) {
      if (protectedKeys.has(key)) {
        continue;
      }

      const maybeId = fileIdFromKey(key);
      if (maybeId && protectedIds.has(maybeId)) {
        continue;
      }

      orphanedKeys.push(key);
    }

    console.log("R2 cleanup scan complete");
    console.log(`- Bucket: ${bucket}`);
    console.log(`- Prefix: ${prefix || "(none)"}`);
    console.log(`- DB protected ids: ${protectedIds.size}`);
    console.log(`- DB protected keys from URLs: ${protectedKeys.size}`);
    console.log(`- Bucket objects scanned: ${allBucketKeys.length}`);
    console.log(`- Candidate orphan objects: ${orphanedKeys.length}`);

    if (orphanedKeys.length > 0) {
      console.log("\nFirst 50 orphan candidates:");
      for (const key of orphanedKeys.slice(0, 50)) {
        console.log(`  ${key}`);
      }
    }

    if (!execute) {
      console.log("\nDry run only. No files were deleted.");
      console.log("Re-run with --execute to delete orphan candidates.");
      return;
    }

    if (orphanedKeys.length === 0) {
      console.log("\nNothing to delete.");
      return;
    }

    console.log("\nDeleting orphaned objects...");
    await deleteKeysInBatches({ client, bucket, keys: orphanedKeys });
    console.log("Done.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("Cleanup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
