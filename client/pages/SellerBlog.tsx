import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

interface SellerPost {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  content: string;
  status: "draft" | "pending_review" | "published" | "archived";
  createdAt?: string;
}

export default function SellerBlog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<SellerPost[]>([]);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    cover: "",
    category: "General",
    tags: "",
    excerpt: "",
    content: "",
    seoTitle: "",
    seoDescription: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.userType !== "seller") {
      navigate("/user-dashboard");
      return;
    }
    fetchMyPosts();
  }, [user]);

  useEffect(() => {
    if (!form.title) return;
    const makeSlug = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    setForm((prev) => ({ ...prev, slug: makeSlug(prev.title) }));
  }, [form.title]);

  const fetchMyPosts = async () => {
    try {
      const token = localStorage.getItem("token")!;
      const res = await api.get("seller/blog", token);
      setPosts(res.data.data as SellerPost[]);
    } catch (e) {
      console.warn("Failed to load posts", e);
    }
  };

  const submit = async (finalize = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token")!;
      const payload = {
        title: form.title,
        slug: form.slug,
        content: form.content,
        excerpt: form.excerpt,
        featuredImage: form.cover,
        category: form.category,
        tags: form.tags
          .split(",")
          .map((t) => (( t ?? "" ).trim()))
          .filter(Boolean),
        submit: finalize,
        seo: {
          title: form.seoTitle || form.title,
          description: form.seoDescription || form.excerpt,
        },
      };
      const res = await api.post("seller/blog", payload, token);
      if ((res.data?.success ?? false) || res.data?._id) {
        await fetchMyPosts();
        setForm({
          title: "",
          slug: "",
          cover: "",
          category: "General",
          tags: "",
          excerpt: "",
          content: "",
          seoTitle: "",
          seoDescription: "",
        });
        alert(finalize ? "Submitted for review" : "Saved as draft");
      }
    } catch (e: any) {
      alert(e?.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: SellerPost["status"]) =>
    s === "published"
      ? "bg-green-100 text-green-800"
      : s === "pending_review"
        ? "bg-yellow-100 text-yellow-800"
        : s === "draft"
          ? "bg-gray-100 text-gray-800"
          : "bg-red-100 text-red-800";

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Blog Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Slug</label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Cover Image URL</label>
            <Input
              value={form.cover}
              onChange={(e) => setForm({ ...form, cover: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Category</label>
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Tags (comma separated)</label>
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Excerpt</label>
            <Textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Content</label>
            <Textarea
              className="min-h-[180px]"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">SEO Title</label>
              <Input
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">SEO Description</label>
              <Input
                value={form.seoDescription}
                onChange={(e) =>
                  setForm({ ...form, seoDescription: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button disabled={loading} onClick={() => submit(false)}>
              Save Draft
            </Button>
            <Button
              disabled={loading}
              className="bg-[#C70000] hover:bg-[#A60000] text-white"
              onClick={() => submit(true)}
            >
              Submit for Review
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-gray-500">No posts yet.</div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <div
                  key={p._id}
                  className="border rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-gray-500">/{p.slug}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColor(p.status)}>
                      {p.status.replace("_", " ")}
                    </Badge>
                    <a
                      className="text-sm text-blue-600 hover:underline"
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Preview
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
