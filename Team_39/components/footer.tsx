import React from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

function Footer() {
  const backgroundPattern = "data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23064e3b' fill-opacity='0.05'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{ backgroundImage: `url("${backgroundPattern}")` }}
      ></div>
      
      <div className="relative container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3">
                Gateless Parking
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Revolutionizing parking across Karnataka with smart technology and seamless booking experiences for Indian drivers.
              </p>
            </div>
            
            {/* Social Links */}
            <div>
              <h4 className="text-white font-semibold mb-3">Follow Us</h4>
              <div className="flex space-x-4">
                {[
                  { icon: Facebook, href: "#", label: "Facebook" },
                  { icon: Twitter, href: "#", label: "Twitter" },
                  { icon: Instagram, href: "#", label: "Instagram" },
                  { icon: Linkedin, href: "#", label: "LinkedIn" }
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    className="w-10 h-10 bg-slate-800 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-500 rounded-lg flex items-center justify-center transition-all duration-300 group"
                    aria-label={label}
                  >
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h4 className="text-white font-semibold text-lg">Contact Us</h4>
            <div className="space-y-4">
              {[
                { icon: Mail, text: "support@gatelessparking.in", href: "mailto:support@gatelessparking.in" },
                { icon: Phone, text: "+91 80 4567 8900", href: "tel:+918045678900" },
                { icon: MapPin, text: "Koramangala, Bangalore, Karnataka 560034", href: "#" }
              ].map(({ icon: Icon, text, href }) => (
                <a
                  key={text}
                  href={href}
                  className="flex items-start space-x-3 text-slate-400 hover:text-emerald-400 transition-colors duration-200 group"
                >
                  <Icon className="w-5 h-5 mt-0.5 text-emerald-500 group-hover:text-emerald-400" />
                  <span className="text-sm leading-relaxed">{text}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Karnataka Cities */}
          <div className="space-y-6">
            <h4 className="text-white font-semibold text-lg">Available Cities</h4>
            <div className="space-y-3">
              {[
                { text: "Bangalore", href: "#", count: "500+ spots" },
                { text: "Mysore", href: "#", count: "150+ spots" },
                { text: "Hubli", href: "#", count: "100+ spots" },
                { text: "Mangalore", href: "#", count: "75+ spots" },
                { text: "All Karnataka Cities", href: "#", count: "View all locations" }
              ].map(({ text, href, count }) => (
                <div key={text} className="flex justify-between items-center">
                  <a
                    href={href}
                    className="text-slate-400 hover:text-emerald-400 transition-colors duration-200 text-sm"
                  >
                    {text}
                  </a>
                  <span className="text-xs text-slate-600">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="space-y-6">
            <div>
              <h4 className="text-white font-semibold text-lg mb-3">Stay Updated</h4>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Get the latest updates on new Karnataka locations, special offers, and parking insights.
              </p>
            </div>
            
            <div className="space-y-3">
              <Input 
                placeholder="Enter your email or mobile" 
                className="bg-slate-800/50 border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20 text-white placeholder:text-slate-500"
              />
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2 rounded-lg transition-all duration-300 shadow-lg shadow-emerald-500/25">
                Subscribe
              </Button>
            </div>

            {/* Newsletter Benefits */}
            <div className="space-y-2">
              {[
                "New Karnataka city launches",
                "Festive season discounts", 
                "Traffic and parking tips"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2 text-slate-400 text-xs">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="pt-4 border-t border-slate-700/50">
              <h5 className="text-slate-300 text-sm font-medium mb-2">Accepted Payments</h5>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span>UPI</span>
                <span>•</span>
                <span>Cards</span>
                <span>•</span>
                <span>Net Banking</span>
                <span>•</span>
                <span>Wallets</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-700/50 mt-12 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex flex-wrap items-center space-x-6 text-sm text-slate-400">
              <span>© 2025 Gateless Parking India Pvt Ltd. All rights reserved.</span>
              <a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Refund Policy</a>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <span>Made with ❤️ for Karnataka</span>
            </div>
          </div>
          
          {/* Indian Compliance */}
          <div className="mt-6 pt-4 border-t border-slate-700/50 text-center">
            <p className="text-xs text-slate-500">
              GST Registration: 29ABCDE1234F1Z5 | 
              CIN: U72900KA2024PTC123456 | 
              Licensed by Karnataka State Government
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer