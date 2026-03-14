"use client";
import { Search, SlidersHorizontal, MapPin, Zap } from "lucide-react";
import { useState } from "react";

const CATEGORIES = ["All", "Gizmos", "Books", "Hostel", "Fashion", "Bikes"];

export const MarketSearch = () => {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <div className="w-full space-y-6">
      {/* Search & Location Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-ahia-sunset transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Search for laptops, textbooks, beds..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-ahia-lg shadow-ahia focus:outline-none focus:ring-2 focus:ring-ahia-sunset/20 focus:border-ahia-sunset transition-all font-sans"
          />
        </div>

        <button className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-ahia-lg shadow-ahia text-gray-600 hover:text-ahia-sunset transition-colors">
          <MapPin size={20} className="text-ahia-trust" />
          <span className="font-bold text-sm">UNIBEN</span>
          <div className="w-1 h-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-400 font-medium">All Halls</span>
        </button>

        <button className="p-4 bg-ahia-text text-black hover:text-white rounded-ahia-lg hover:bg-black transition-colors shadow-ahia">
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Filter Chips & Quick Toggles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${
                activeTab === cat
                  ? "bg-ahia-sunset border-ahia-sunset text-white shadow-md shadow-ahia-sunset/20"
                  : "bg-white border-gray-100 text-gray-500 hover:border-ahia-sunset/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Safety-Lock Quick Toggle */}
        <button className="flex items-center gap-2 px-3 py-2 bg-ahia-trust/5 border border-ahia-trust/10 rounded-ahia group hover:bg-ahia-trust/10 transition-all">
          <Zap
            size={14}
            className="text-ahia-trust fill-ahia-trust group-hover:scale-110 transition-transform"
          />
          <span className="text-[10px] font-bold text-ahia-trust uppercase tracking-wider">
            Fast Escrow Only
          </span>
        </button>
      </div>
    </div>
  );
};
