import React from "react";
import Footer from "@/components/footer";
import SearchComponent from "@/components/search-component";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23064e3b' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        {/* Main Content */}
        <div className="relative sm:container mx-auto px-4 pt-8 pb-16">
          {/* Hero Text */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent mb-6">
              Smart Parking,
              <br />
              <span className="text-white">Across Karnataka</span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Find and reserve parking spots instantly in Bangalore, Mysore, Hubli, and across Karnataka. 
              No more circling around busy streets.
            </p>
          </div>

          {/* Search Component */}
          <SearchComponent />
          
          {/* Value Proposition */}
          <div className="mt-20 text-center">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              Parking made simple for Karnataka drivers.
            </h2>
            <p className="text-lg text-slate-400 mb-16">
              Join thousands of drivers across Karnataka who have eliminated parking stress
            </p>
          </div>

          {/* How It Works Section */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">How It Works</h3>
              <p className="text-slate-400 text-lg">Simple steps to secure your parking spot</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  step: "1",
                  title: "Enter Your Destination",
                  description: "Tell us where you're going in Karnataka",
                  icon: "🎯",
                  examples: "MG Road, Brigade Road, Mysore Palace..."
                },
                {
                  step: "2", 
                  title: "Select Date & Time",
                  description: "Choose your arrival and departure time",
                  icon: "🕐",
                  examples: "Available 24/7 across major cities"
                },
                {
                  step: "3",
                  title: "Pay & Park",
                  description: "Book with UPI/Card and park worry-free",
                  icon: "🚗",
                  examples: "Instant confirmation via SMS & Email"
                }
              ].map((item, index) => (
                <div key={index} className="relative group">
                  {/* Connection Line */}
                  {index < 2 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-emerald-500 to-transparent z-0"></div>
                  )}
                  
                  {/* Card */}
                  <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center group-hover:bg-slate-800/70 transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-500/50">
                    {/* Step Number */}
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg shadow-emerald-500/25">
                      {item.step}
                    </div>
                    
                    {/* Icon */}
                    <div className="text-4xl mb-4">{item.icon}</div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                    <p className="text-slate-400 leading-relaxed mb-3">{item.description}</p>
                    <p className="text-xs text-slate-500 italic">{item.examples}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Problem Statement */}
          <section className="py-16 text-center">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-8">
              No more traffic jams
              <br />
              <span className="text-emerald-400">hunting for parking.</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
              {[
                { stat: "10L+", label: "Minutes Saved Monthly", color: "emerald", desc: "Across Karnataka cities" },
                { stat: "92%", label: "Success Rate", color: "teal", desc: "Guaranteed spot availability" },
                { stat: "₹50+", label: "Average Savings", color: "cyan", desc: "Per booking vs street parking" }
              ].map((item, index) => (
                <div key={index} className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                  <div className={`text-4xl font-bold mb-2 ${item.color === 'emerald' ? 'text-emerald-400' : item.color === 'teal' ? 'text-teal-400' : 'text-cyan-400'}`}>
                    {item.stat}
                  </div>
                  <div className="text-white font-medium mb-1">{item.label}</div>
                  <div className="text-slate-500 text-sm">{item.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Karnataka Cities Section */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">
                Available Across Karnataka
              </h3>
              <p className="text-slate-400 text-lg">
                Growing network of parking spots in major Karnataka cities
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { city: "Bangalore", spots: "500+", area: "Tech Capital" },
                { city: "Mysore", spots: "150+", area: "Cultural City" },
                { city: "Hubli", spots: "100+", area: "Commercial Hub" },
                { city: "Mangalore", spots: "75+", area: "Coastal City" },
                { city: "Belgaum", spots: "60+", area: "Border Town" },
                { city: "Gulbarga", spots: "45+", area: "Historic City" },
                { city: "Shimoga", spots: "40+", area: "Nature's Gateway" },
                { city: "Tumkur", spots: "35+", area: "Educational Hub" }
              ].map((location, index) => (
                <div key={index} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 text-center hover:border-emerald-500/50 transition-colors">
                  <h4 className="text-white font-semibold mb-1">{location.city}</h4>
                  <p className="text-emerald-400 text-sm font-medium">{location.spots} spots</p>
                  <p className="text-slate-500 text-xs">{location.area}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Mobile App Section */}
      <section className="relative bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Made for Indian Roads
              </h3>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                Built specifically for Indian traffic conditions and payment preferences. 
                Seamless experience whether you are navigating Bangalore traffic or exploring Mysore.
              </p>
              <div className="space-y-4 text-left">
                {[
                  "Real-time traffic & availability updates",
                  "UPI, PhonePe, GPay integration",
                  "Multi-language support (Kannada, English)",
                  "Local customer support"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-4 bg-emerald-900/20 border border-emerald-700/30 rounded-xl">
                <p className="text-emerald-300 text-sm">
                  🎉 <strong>Special Launch Offer:</strong> Use code KARNATAKA50 for ₹50 off your first booking!
                </p>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-3xl rounded-full"></div>
                <Image 
                  alt="Mobile app screenshot showing Karnataka locations" 
                  width={320} 
                  height={400}
                  src="/gateless-parking-mobile.png" 
                  className="relative rounded-3xl shadow-2xl shadow-emerald-500/20 border border-slate-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}