import { getPostByShareToken } from "@/app/_lib/posts/posts-repo";
import { notFound } from "next/navigation";

export default async function PostPage({
  params,
}: {
  params: { shareToken: string };
}) {
  const { shareToken } = await params;
  const post = await getPostByShareToken(shareToken);
  if (!post) {
    return notFound();
  }
  return (
    <div>
      <p className="whitespace-pre-wrap">{post.content}</p>
    </div>
  );
}
