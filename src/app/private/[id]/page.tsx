import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrivateDownloadPageClient } from "@/components/pages/PrivateDownloadPageClient";
import { getPrivateUploadPublicInfo } from "@/lib/server/private-upload";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const upload = await getPrivateUploadPublicInfo(id);

  return {
    title: upload ? `${upload.filename} | AnonHost` : "Private upload not found",
    description: "Password-protected private file transfer.",
  };
}

export default async function PrivateDownloadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const upload = await getPrivateUploadPublicInfo(id);

  if (!upload || upload.consumedAt) {
    notFound();
  }

  return (
    <PrivateDownloadPageClient
      id={upload.id}
      filename={upload.filename}
      size={upload.size}
      oneUse={upload.oneUse}
    />
  );
}
