import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../hooks/useAuth";

type Props = {
  // Property ya agent ID jiske against review dalna hai
  targetId: string;
  targetType?: "property" | "agent"; // abhi backend testimonial me sirf optional mapping use hoga
};

export default function ReviewForm({ targetId, targetType = "property" }: Props) {
  const { user, token, userProfile } = useAuth();
  const { toast } = useToast();

  // If user me name/email hai to fields prefill; warna user se mang lo
  const [name, setName] = useState<string>(userProfile?.name || user?.user_metadata?.name || "");
  const [email, setEmail] = useState<string>(user?.email || "");
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const isAuthed = !!token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      toast({ title: "Invalid rating", description: "Rating 1–5 required" });
      return;
    }
    if (!comment || comment.trim().length < 5) {
      toast({ title: "Comment too short", description: "Please write at least 5 characters" });
      return;
    }
    // name/email ensure
    if (!name || !email) {
      toast({ title: "Name & Email required", description: "Please fill your name and email" });
      return;
    }

    try {
      setSubmitting(true);

      // NOTE: Testimonials API ko propertyId/sellerId accept hai.
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        rating,
        comment: comment.trim(),
        // mapping: property par review aa raha hai to propertyId bhej do
        propertyId: targetType === "property" ? targetId : undefined,
        sellerId: targetType === "agent" ? targetId : undefined,
      };

      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isAuthed ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        toast({
          title: "Review submitted",
          description: "Waiting for admin approval",
        });
        setComment("");
        setRating(5);
      } else {
        throw new Error(data?.error || "Failed to submit testimonial");
      }
    } catch (err: any) {
      toast({
        title: "Submit failed",
        description: String(err?.message || err) || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6 border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">Write a review</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name / Email (show only if not present) */}
        {!name && (
          <div className="flex flex-col">
            <label className="text-sm mb-1">Your Name</label>
            <input
              className="border rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
        )}

        {!email && (
          <div className="flex flex-col">
            <label className="text-sm mb-1">Your Email</label>
            <input
              type="email"
              className="border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
        )}

        <div className="flex flex-col">
          <label className="text-sm mb-1">Rating</label>
          <select
            className="border rounded px-3 py-2"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} ⭐</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm mb-1">Comment</label>
          <textarea
            className="border rounded px-3 py-2"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience…"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#C70000] hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </form>
    </div>
  );
}
