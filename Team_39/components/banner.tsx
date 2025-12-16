import React from 'react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MenuIcon, Car, Calendar, Settings, LogOut, User, Shield } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

function Banner() {
  return (
    <nav className="relative">
      {/* Main Navigation */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl shadow-slate-900/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <header>
              <Link href='/' className="group flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    Gateless
                  </h1>
                  <span className="text-xs text-slate-500 -mt-1 hidden sm:block">PARKING</span>
                </div>
              </Link>
            </header>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href='/mybookings' 
                className="flex items-center space-x-2 text-slate-300 hover:text-emerald-400 transition-colors duration-200 font-medium"
              >
                <Calendar className="w-4 h-4" />
                <span>My Bookings</span>
              </Link>
              
              <Link 
                href='/dashboard' 
                className="flex items-center space-x-2 text-slate-300 hover:text-emerald-400 transition-colors duration-200 font-medium"
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>

              {/* Auth Section */}
              <div className="flex items-center space-x-4">
                <SignedOut>
                  <SignInButton>
                    <button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40">
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <div className="bg-slate-800/50 rounded-lg p-1">
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8",
                          userButtonPopoverCard: "bg-slate-800 border-slate-700",
                          userButtonPopoverActions: "bg-slate-800"
                        }
                      }}
                    />
                  </div>
                </SignedIn>
              </div>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                  <MenuIcon className="w-5 h-5 text-slate-300" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-800/95 backdrop-blur-xl border-slate-700/50 shadow-2xl">
                  <DropdownMenuLabel className="text-emerald-400 font-semibold">
                    Navigation
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-700/50" />
                  
                  <DropdownMenuItem className="text-slate-300 hover:text-emerald-400 hover:bg-slate-700/50">
                    <Link href='/mybookings' className="flex items-center space-x-2 w-full">
                      <Calendar className="w-4 h-4" />
                      <span>My Bookings</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="text-slate-300 hover:text-emerald-400 hover:bg-slate-700/50">
                    <Link href='/dashboard' className="flex items-center space-x-2 w-full">
                      <Shield className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-slate-700/50" />
                  
                  <SignedOut>
                    <DropdownMenuItem className="text-emerald-400 hover:bg-emerald-500/20">
                      <SignInButton>
                        <div className="flex items-center space-x-2 w-full">
                          <User className="w-4 h-4" />
                          <span>Sign In</span>
                        </div>
                      </SignInButton>
                    </DropdownMenuItem>
                  </SignedOut>
                  
                  <SignedIn>
                    <DropdownMenuItem className="text-slate-300 hover:text-emerald-400 hover:bg-slate-700/50">
                      <div className="flex items-center space-x-2 w-full">
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-slate-300 hover:text-red-400 hover:bg-red-500/20">
                      <div className="flex items-center space-x-2 w-full">
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </div>
                    </DropdownMenuItem>
                  </SignedIn>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation spacer */}
      <div className="h-4 bg-gradient-to-b from-slate-900/50 to-transparent"></div>
    </nav>
  )
}

export default Banner