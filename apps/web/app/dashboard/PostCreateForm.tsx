"use client";
import React, { useState } from "react";

export default function PostCreateForm() {
  const [content, setContent] = useState("");
  const [shareURL, setShareURL] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // ページリロードを止める
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();

      setShareURL(data.shareURL);
      setContent("");
    } catch (error) {
      console.error(error);
      alert("投稿に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "投稿中..." : "投稿する"}
        </button>
      </form>
      <div>
        <a href={shareURL} target="_blank" rel="noopener noreferrer">
          {shareURL ? shareURL : "URLが発行できませんでした。"}
        </a>
      </div>
    </>
  );
}
