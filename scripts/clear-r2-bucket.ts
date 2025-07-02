#!/usr/bin/env bun

import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  DeleteObjectsCommandInput,
} from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const BATCH_SIZE = 1000;

interface DeleteStats {
  totalObjects: number;
  deletedObjects: number;
  errors: number;
}

async function listAllObjects(): Promise<string[]> {
  const objects: string[] = [];
  let continuationToken: string | undefined;

  console.log("📋 Listing all objects in bucket...");

  do {
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const response = await r2Client.send(command);

      if (response.Contents) {
        const keys = response.Contents.map((obj) => obj.Key!).filter(Boolean);
        objects.push(...keys);
        console.log(
          `   Found ${keys.length} objects (total: ${objects.length})`
        );
      }

      continuationToken = response.NextContinuationToken;
    } catch (error) {
      console.error("❌ Error listing objects:", error);
      throw error;
    }
  } while (continuationToken);

  return objects;
}

async function deleteObjectsBatch(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;

  try {
    const deleteParams: DeleteObjectsCommandInput = {
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: true,
      },
    };

    const command = new DeleteObjectsCommand(deleteParams);
    const response = await r2Client.send(command);

    const errors = response.Errors?.length || 0;
    const deleted = keys.length - errors;

    if (errors > 0) {
      console.warn(`⚠️  ${errors} deletion errors in batch`);
      response.Errors?.forEach((error) => {
        console.warn(`   Error deleting ${error.Key}: ${error.Message}`);
      });
    }

    return deleted;
  } catch (error) {
    console.error("❌ Error deleting batch:", error);
    return 0;
  }
}

async function clearBucket(): Promise<DeleteStats> {
  const stats: DeleteStats = {
    totalObjects: 0,
    deletedObjects: 0,
    errors: 0,
  };

  console.log(`Clearing R2 bucket: ${BUCKET_NAME}`);
  console.log("WARNING: This will delete ALL objects in the bucket!");

  try {
    const allObjects = await listAllObjects();
    stats.totalObjects = allObjects.length;

    if (allObjects.length === 0) {
      console.log("Bucket is already empty");
      return stats;
    }

    console.log(`\nDeleting ${allObjects.length} objects...`);

    for (let i = 0; i < allObjects.length; i += BATCH_SIZE) {
      const batch = allObjects.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allObjects.length / BATCH_SIZE);

      console.log(
        `   Processing batch ${batchNumber}/${totalBatches} (${batch.length} objects)`
      );

      const deleted = await deleteObjectsBatch(batch);
      stats.deletedObjects += deleted;
      stats.errors += batch.length - deleted;

      if (i + BATCH_SIZE < allObjects.length) {
        // not sure this is necessary, but just in case
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error("Fatal error during cleaning:", error);
    throw error;
  }

  return stats;
}

async function confirmDeletion(): Promise<boolean> {
  if (process.env.NODE_ENV === "production") {
    console.error("That could've been bad. Don't use this in production.");
    return false;
  }

  if (process.argv.includes("--force") || process.argv.includes("-f")) {
    console.log(" Force flag detected, skipping confirmation");
    return true;
  }

  console.log("\nDANGER ZONE");
  console.log(`You are about to delete ALL objects in bucket: ${BUCKET_NAME}`);
  console.log("This action cannot be undone!");
  console.log("\nTo proceed, run the script with --force flag:");
  console.log("npm run clear-bucket -- --force");
  console.log("or");
  console.log("tsx scripts/clear-r2-bucket.ts --force");

  return false;
}

async function main() {
  try {
    if (
      !process.env.R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY ||
      !BUCKET_NAME
    ) {
      console.error("Missing required R2 environment variables");
      console.error(
        "Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME"
      );
      process.exit(1);
    }
    console.log(`Target bucket: ${BUCKET_NAME}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}\n`);
    if (!(await confirmDeletion())) {
      process.exit(0);
    }
    const startTime = Date.now();
    const stats = await clearBucket();
    const duration = Date.now() - startTime;
    console.log("\nDeletion Summary:");
    console.log(`   Total objects found: ${stats.totalObjects}`);
    console.log(`   Successfully deleted: ${stats.deletedObjects}`);
    console.log(`   Errors: ${stats.errors}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
    if (stats.errors > 0) {
      console.log("\nSome objects could not be deleted. Check the logs above.");
      process.exit(1);
    } else {
      console.log("\nBucket cleared successfully!");
    }
  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { clearBucket, listAllObjects, deleteObjectsBatch };
