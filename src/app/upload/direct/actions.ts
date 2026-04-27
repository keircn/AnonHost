"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  createDirectUploadForUser,
  finalizeDirectUploadForUser,
  markDirectUploadFailedForUser,
  type CreateDirectUploadInput,
  type CreateDirectUploadResponse,
  type FinalizeDirectUploadInput,
  type FinalizeDirectUploadResponse,
} from "@/lib/server/direct-upload";

type ActionError = {
  ok: false;
  error: string;
};

type ActionSuccess<T> = {
  ok: true;
  data: T;
};

export type ActionResult<T> = ActionSuccess<T> | ActionError;

export async function createDirectUpload(
  input: Omit<CreateDirectUploadInput, "userId">,
): Promise<ActionResult<CreateDirectUploadResponse>> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const data = await createDirectUploadForUser({
      userId: session.user.id,
      ...input,
    });
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create upload URL",
    };
  }
}

export async function finalizeDirectUpload(
  input: Omit<FinalizeDirectUploadInput, "userId">,
): Promise<ActionResult<FinalizeDirectUploadResponse>> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const data = await finalizeDirectUploadForUser({
      userId: session.user.id,
      ...input,
    });
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload could not be finalized",
    };
  }
}

export async function markDirectUploadFailed(imageId: string): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    await markDirectUploadFailedForUser(session.user.id, imageId);
    return { ok: true, data: null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to mark upload as failed",
    };
  }
}
