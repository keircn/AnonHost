import prisma from "./prisma"

export async function verifyApiKey(apiKey: string) {
  if (!apiKey) return null

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    include: { user: true },
  })

  if (!key) return null

  return key.user
}

