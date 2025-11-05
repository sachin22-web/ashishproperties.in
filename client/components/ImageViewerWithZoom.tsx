import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import Watermark from "./Watermark";

interface ImageViewerWithZoomProps {
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  title?: string;
  watermarkEnabled?: boolean;
  watermarkPosition?: "bottom-right" | "center" | "pattern";
  watermarkOpacity?: number;
  watermarkText?: string;
  allowDownload?: boolean;
}

export default function ImageViewerWithZoom({
  images,
  currentIndex,
  onIndexChange,
  title = "",
  watermarkEnabled = true,
  watermarkPosition = "bottom-right",
  watermarkOpacity = 0.6,
  watermarkText = "ashishproperties.in",
  allowDownload = true,
}: ImageViewerWithZoomProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentIndex];

  useEffect(() => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    setIsZoomed(false);
  }, [currentIndex]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.5, 3);
    setZoomLevel(newZoom);
    setIsZoomed(newZoom > 1);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.5, 1);
    setZoomLevel(newZoom);
    setIsZoomed(newZoom > 1);
    if (newZoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    setIsZoomed(false);
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
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `property-image-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const nextImage = () => {
    if (currentIndex < images.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 z-20 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3}
          className="bg-white/90 hover:bg-white shadow-lg"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleZoomOut}
          disabled={zoomLevel <= 1}
          className="bg-white/90 hover:bg-white shadow-lg"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        {isZoomed && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleResetZoom}
            className="bg-white/90 hover:bg-white shadow-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {allowDownload && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleDownload}
            className="bg-white/90 hover:bg-white shadow-lg"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Image Container */}
      <div
        ref={imageRef}
        className="relative aspect-video overflow-hidden bg-gray-100 rounded-lg cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        }}
      >
        <img
          src={currentImage}
          alt={title}
          className="w-full h-full object-contain transition-transform"
          style={{
            transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
            transformOrigin: "center",
          }}
          draggable={false}
        />

        {/* Watermark Overlay */}
        {watermarkEnabled && (
          <>
            {watermarkPosition === "pattern" && (
              <Watermark variant="pattern" opacity={watermarkOpacity} angle={-45} />
            )}
            {watermarkPosition === "center" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div
                  className="text-4xl font-bold text-white select-none"
                  style={{
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                    opacity: watermarkOpacity,
                  }}
                >
                  {watermarkText}
                </div>
              </div>
            )}
            {watermarkPosition === "bottom-right" && (
              <div className="absolute bottom-4 right-4 pointer-events-none z-10">
                <div
                  className="px-4 py-2 bg-black/70 text-white rounded-lg text-sm font-semibold select-none"
                  style={{ opacity: watermarkOpacity }}
                >
                  {watermarkText}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 z-20"
            onClick={prevImage}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 z-20"
            onClick={nextImage}
            disabled={currentIndex === images.length - 1}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
