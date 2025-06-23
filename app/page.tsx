import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle dot pattern background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Geometric lines pattern with subtle blue accent */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(90deg, transparent 24px, rgba(30,58,138,0.1) 25px, rgba(30,58,138,0.1) 26px, transparent 27px, transparent 74px, rgba(0,0,0,0.1) 75px, rgba(0,0,0,0.1) 76px, transparent 77px),
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px",
        }}
      />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
            Xylor<span className="text-blue-900">.AI</span>
          </h1>
        </div>

        {/* Main Headline */}
        <h2 className="text-3xl md:text-5xl font-bold text-black mb-6 leading-tight">
          Construction Bids & Estimates
        </h2>

        <h3 className="text-2xl md:text-4xl font-light text-gray-700 mb-12">
          From <span className="text-gray-400 line-through">Weeks</span> to{" "}
          <span className="text-blue-900 font-semibold">Minutes</span>
        </h3>

        {/* Minimal Copy */}
        <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Transform your construction workflow with AI-powered precision.
          Generate accurate bids and estimates in minutes, not weeks.
        </p>

        {/* CTA Button */}
        <Link href="/upload">
          <button className="bg-blue-900 cursor-pointer hover:bg-blue-800 text-white font-semibold text-lg md:text-xl px-12 py-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out relative">
            TEST XYLOR AI
          </button>
        </Link>
      </div>
    </div>
  );
}
