import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, body } = await request.json();

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: { title: title.trim(), body: body.trim() },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
