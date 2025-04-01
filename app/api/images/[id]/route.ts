import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { verifyApiKey } from "@/lib/auth"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id

  const session = await getServerSession(authOptions)
  const apiKey = req.headers.get("authorization")?.split("Bearer ")[1]

  if (!session && !apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let userId: number

  if (apiKey) {
    const user = await verifyApiKey(apiKey)
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }
    userId = user.id

    await prisma.apiKey.update({
      where: { key: apiKey },
      data: { lastUsed: new Date() },
    })
  } else {
    userId = session!.user.id
  }

  const image = await prisma.image.findUnique({
    where: { id: Number(id) },
  })

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 })
  }

  if (image.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.image.delete({
    where: { id: Number(id) },
  })

  return NextResponse.json({
    success: true,
    message: "Image deleted successfully",
  })
}

