"use client";

import { useState, FormEvent } from "react";
import type { Comment } from "@/app/generated/prisma/client";

type Props = {
  postId: number;
  initialComments: Comment[];
};

export default function CommentSection({ postId, initialComments }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, body }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create comment");
      }

      const comment: Comment = await res.json();
      setComments([comment, ...comments]);
      setAuthorName("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      <h3 style={{ margin: "0 0 0.75rem" }}>Comments ({comments.length})</h3>

      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor={`author-${postId}`} style={{ display: "block", marginBottom: "0.25rem" }}>
            Name
          </label>
          <input
            id={`author-${postId}`}
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
          />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor={`comment-${postId}`} style={{ display: "block", marginBottom: "0.25rem" }}>
            Comment
          </label>
          <textarea
            id={`comment-${postId}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={3}
            style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
          />
        </div>
        <button type="submit" disabled={submitting} style={{ padding: "0.5rem 1.25rem", fontSize: "1rem" }}>
          {submitting ? "Saving..." : "Add Comment"}
        </button>
      </form>

      {comments.length === 0 ? (
        <p style={{ color: "#888", fontSize: "0.9rem" }}>No comments yet.</p>
      ) : (
        comments.map((comment) => (
          <div
            key={comment.id}
            style={{ borderTop: "1px solid #eee", paddingTop: "0.75rem", marginTop: "0.75rem" }}
          >
            <p style={{ margin: "0 0 0.25rem", whiteSpace: "pre-wrap" }}>{comment.body}</p>
            <span style={{ fontSize: "0.8rem", color: "#888" }} suppressHydrationWarning>
              {comment.authorName} &middot; {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
