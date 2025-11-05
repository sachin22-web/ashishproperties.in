import React, { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "./ui/button";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  title?: string;
}

export default function ImageModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title = "",
}: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentIndex];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleZoom = () => {
    if (zoomLevel > 1) {
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setZoomLevel(2);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Add watermark
        const fontSize = Math.max(40, Math.floor(img.width / 8));
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Rotate canvas for diagonal watermark
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText("ashishproperties.in", 0, 0);
        ctx.restore();

        // Download the canvas as image
        canvas.toBlob(
          (blob) => {
            if (!blob) return;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `property-image-${currentIndex + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          },
          "image/jpeg",
          0.95,
        );
      };
      img.src = window.URL.createObjectURL(blob);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const nextImage = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex-1">
          <h2 className="text-white text-lg font-semibold">{title}</h2>
          <p className="text-white/70 text-sm">
            Image {currentIndex + 1} of {images.length}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mr-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="text-white hover:bg-white/20"
            title="Download with watermark"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image Container */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div
          ref={imageRef}
          className="relative w-full h-full flex items-center justify-center"
          onMouseDown={handleMouseDown}
          style={{
            cursor:
              zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "pointer",
          }}
        >
          <img
            src={currentImage}
            alt={title}
            onClick={handleToggleZoom}
            className="max-w-full max-h-full object-contain transition-transform"
            style={{
              transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
              transformOrigin: "center",
            }}
            draggable={false}
          />

          {/* Watermark */}
          <div className="absolute inset-0 pointer-events-none opacity-40 flex items-center justify-center">
            <div
              className="text-4xl font-bold text-white select-none"
              style={{
                textShadow: "2px 2px 6px rgba(0,0,0,0.7)",
                transform: "rotate(-45deg)",
                whiteSpace: "nowrap",
                letterSpacing: "1px",
              }}
            >
              ashishproperties.in
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="lg"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 bg-black/40 z-20"
              onClick={prevImage}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 bg-black/40 z-20"
              onClick={nextImage}
              disabled={currentIndex === images.length - 1}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
