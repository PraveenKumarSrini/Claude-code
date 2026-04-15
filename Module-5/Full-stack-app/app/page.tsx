import prisma from "@/lib/prisma";
import PostForm from "./PostForm";
import CommentSection from "./CommentSection";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { comments: { orderBy: { createdAt: "desc" } } },
  });

  return (
    <main style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Posts</h1>
      <PostForm />
      <section>
        {posts.length === 0 ? (
          <p style={{ color: "#888" }}>No posts yet. Create one above.</p>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              style={{
                borderTop: "1px solid #ddd",
                paddingTop: "1rem",
                marginTop: "1rem",
              }}
            >
              <h2 style={{ margin: "0 0 0.25rem" }}>{post.title}</h2>
              <p style={{ margin: "0 0 0.5rem", whiteSpace: "pre-wrap" }}>{post.body}</p>
              <time style={{ fontSize: "0.8rem", color: "#888" }}>
                {new Date(post.createdAt).toLocaleString()}
              </time>
              <CommentSection postId={post.id} initialComments={post.comments} />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
