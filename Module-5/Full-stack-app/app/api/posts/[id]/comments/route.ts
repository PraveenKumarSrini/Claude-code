import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const postId = parseInt((await params).id, 10);

    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET /api/posts/[id]/comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const postId = parseInt((await params).id, 10);

    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const { authorName, body } = await request.json();

    if (!authorName?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "authorName and body are required" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: { authorName: authorName.trim(), body: body.trim(), postId },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts/[id]/comments error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
