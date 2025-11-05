import { useEffect, useState } from "react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";

interface BlogPostLite {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  author?: { name?: string };
  category?: string;
  publishedAt?: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPostLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Blog | Ashish Properties";
    setMetaTag(
      "description",
      "Property tips, market updates, and project news.",
    );
    setOGTag("og:title", "Blog | Ashish Properties");
    setOGTag("og:type", "website");
    setOGTag("og:url", window.location.href);
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/blog");
        const data = await res.json();
        if (data.success) {
          setPosts((data.data?.posts ?? []) as BlogPostLite[]);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading blog...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Blog</h1>
        {posts.length === 0 ? (
          <div className="text-center text-gray-600 py-16">No posts yet.</div>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <a
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="block bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow"
              >
                {p.featuredImage && (
                  <img
                    src={p.featuredImage}
                    alt={p.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-48 object-cover rounded mb-3"
                  />
                )}
                <h2 className="text-xl font-semibold">{p.title}</h2>
                <p className="text-gray-600 mt-1">{p.excerpt}</p>
                <div className="text-xs text-gray-500 mt-2">
                  {p.category || "General"} •{" "}
                  {p.publishedAt
                    ? new Date(p.publishedAt).toLocaleDateString()
                    : ""}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
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
