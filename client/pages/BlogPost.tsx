import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";

interface BlogPostFull {
  _id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  author?: { name?: string };
  category?: string;
  tags?: string[];
  publishedAt?: string;
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blog/${slug}`);
        const data = await res.json();
        if (data.success) setPost(data.data as BlogPostFull);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} | Ashish Properties`;
    setMetaTag("description", post.excerpt || post.title);
    setOGTag("og:title", post.title);
    setOGTag("og:description", post.excerpt || post.title);
    if (post.featuredImage) setOGTag("og:image", post.featuredImage);
    setOGTag("og:type", "article");
    setOGTag("og:url", window.location.href);
    if (post.publishedAt)
      setMetaTag(
        "article:published_time",
        new Date(post.publishedAt).toISOString(),
      );
  }, [post]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading post...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-4 max-w-3xl mx-auto">Post not found.</div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <article className="p-4 max-w-3xl mx-auto bg-white rounded-lg shadow mt-4">
        {post.featuredImage && (
          <img
            src={post.featuredImage}
            alt={post.title}
            loading="lazy"
            decoding="async"
            className="w-full h-64 object-cover rounded mb-4"
          />
        )}
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <div className="text-sm text-gray-500 mb-6">
          {post.category || "General"} •{" "}
          {post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString()
            : ""}
        </div>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
      <BottomNavigation />
    </div>
  );
}

function setMetaTag(name: string, content: string) {
  let tag = document.querySelector(
    `meta[name='${name}']`,
  ) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setOGTag(property: string, content: string) {
  let tag = document.querySelector(
    `meta[property='${property}']`,
  ) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}
