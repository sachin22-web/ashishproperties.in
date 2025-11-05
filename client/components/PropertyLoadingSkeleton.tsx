import React from "react";

export default function PropertyLoadingSkeleton() {
  return (
    <div className="bg-white">
      <div className="px-4 py-4">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
        
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Image skeleton */}
              <div className="aspect-square bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
              
              {/* Content skeleton */}
              <div className="p-3 space-y-2">
                {/* Price */}
                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                
                {/* Title */}
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
                
                {/* Location */}
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                
                {/* Time and type */}
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
