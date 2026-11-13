// Same template as /scar-reef/ (new post, 2026-11-13: docs Mocean-Page-Improvement-1.md).
// Blog post. Content: src/content/posts/northern-rights-sumbawa.json
import PostPage, { type PostContent } from "@/components/elementor/PostPage";
import content from "@/content/posts/northern-rights-sumbawa.json";
import { pageMetadata } from "@/lib/metadata";
import "@/styles/elementor/post-12031.css";
import "@/styles/elementor/post-15631.css";
import "@/components/elementor/styles-after";

export const metadata = pageMetadata("/northern-rights-sumbawa/");

export default function Page() {
  return <PostPage post={content as PostContent} />;
}
