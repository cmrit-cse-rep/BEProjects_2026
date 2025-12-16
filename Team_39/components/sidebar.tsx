import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import ActiveLink from './active-link'
import { UserButton } from '@clerk/nextjs'
import { Car, MapPin, Calendar, DollarSign, BarChart3, Settings, Home } from 'lucide-react'

export interface MenuItem {
  id: string,
  href: string,
  title: string,
  icon: React.ElementType,
  description: string
}

function Sidebar() {
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      href: '/dashboard',
      title: 'Overview',
      icon: Home,
      description: 'Dashboard overview'
    },
    {
      id: 'locations',
      href: '/dashboard/locations/tileview',
      title: 'Locations',
      icon: MapPin,
      description: 'Manage parking spots'
    },
    {
      id: 'bookings',
      href: '/dashboard/bookings',
      title: 'Bookings',
      icon: Calendar,
      description: 'View reservations'
    },
    {
      id: 'revenue',
      href: '/dashboard/revenue',
      title: 'Revenue',
      icon: DollarSign,
      description: 'Financial analytics'
    }
  ]

  return (
    <aside className="flex flex-col w-72 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <Link href="/dashboard" className="group flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <span className="text-xs text-slate-500">Parking Management</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <ActiveLink key={item.id} href={item.href}>
              <div className="flex items-center space-x-3 p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-300 group">
                <div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center group-hover:bg-emerald-600/20 group-hover:text-emerald-400 transition-all duration-300">
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-slate-500 group-hover:text-slate-400">
                    {item.description}
                  </div>
                </div>
              </div>
            </ActiveLink>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Quick Stats</span>
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Active Locations</span>
              <span className="text-emerald-400 font-medium">12</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Today's Bookings</span>
              <span className="text-blue-400 font-medium">47</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Revenue (MTD)</span>
              <span className="text-amber-400 font-medium">$2,840</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 rounded-lg",
                  userButtonPopoverCard: "bg-slate-800 border-slate-700",
                  userButtonPopoverActions: "bg-slate-800"
                }
              }}
            />
            <div className="flex flex-col">
              <span className="text-white text-sm font-medium">Admin</span>
              <span className="text-slate-500 text-xs">Online</span>
            </div>
          </div>
          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar