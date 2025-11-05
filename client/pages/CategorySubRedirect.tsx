import { useEffect } from "react";
import { useParams } from "react-router-dom";

export default function CategorySubRedirect() {
  const { categorySlug, subSlug } = useParams<{
    categorySlug: string;
    subSlug: string;
  }>();
  useEffect(() => {
    if (categorySlug && subSlug) {
      window.location.href = `/properties?category=${encodeURIComponent(categorySlug)}&subcategory=${encodeURIComponent(subSlug)}`;
    }
  }, [categorySlug, subSlug]);
  return null;
}
