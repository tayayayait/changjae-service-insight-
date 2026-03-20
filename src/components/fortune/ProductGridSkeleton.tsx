import React from "react";

export const ProductGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i} 
          className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex flex-col gap-4 animate-pulse"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-gray-100 rounded-xl" />
            <div className="w-16 h-5 bg-gray-100 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-100 rounded-full w-2/3" />
            <div className="h-4 bg-gray-50 rounded-full w-full" />
            <div className="h-4 bg-gray-50 rounded-full w-5/6" />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-12 h-3 bg-gray-50 rounded-full" />
            <div className="w-12 h-3 bg-gray-50 rounded-full" />
          </div>
          <div className="h-10 bg-gray-100 rounded-xl w-full mt-2" />
        </div>
      ))}
    </div>
  );
};
