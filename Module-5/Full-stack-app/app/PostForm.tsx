"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function PostForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create post");
      }

      setTitle("");
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <h2>New Post</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="title" style={{ display: "block", marginBottom: "0.25rem" }}>
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
        />
      </div>
      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="body" style={{ display: "block", marginBottom: "0.25rem" }}>
          Body
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={4}
          style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
        />
      </div>
      <button type="submit" disabled={submitting} style={{ padding: "0.5rem 1.25rem", fontSize: "1rem" }}>
        {submitting ? "Saving..." : "Create Post"}
      </button>
    </form>
  );
}
