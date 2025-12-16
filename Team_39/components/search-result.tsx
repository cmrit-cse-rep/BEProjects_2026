import { MapAddressType, MapParams } from '@/types'
import React from 'react'
import { SearchParams } from './search-component'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { cn, formatAmountForDisplay, getStreetFromAddress } from '@/lib/utils'
import Link from 'next/link'
import { buttonVariants } from './ui/button'
import { MapPin, Car, Clock, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'

function SearchResult({
  locations, params
}: {
  locations: MapParams[],
  params: SearchParams
}) {
  const parkingLocations = locations.filter(loc => loc.type === MapAddressType.PARKINGLOCATION)
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sticky top-0 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 pb-4 mb-4">
        <h3 className="text-white font-semibold text-lg mb-1">Available Parking Spots</h3>
        <p className="text-slate-400 text-sm">{parkingLocations.length} locations found in Karnataka</p>
      </div>

      {parkingLocations.map((loc, index) => {
        const availableSpots = loc.numberofspots! - loc.bookedspots!
        const isFullyBooked = availableSpots === 0
        const isLowAvailability = availableSpots <= 2 && availableSpots > 0
        
        return (
          <Card key={loc.address} className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600/50 transition-all duration-300 overflow-hidden">
            <CardHeader className="pb-3">
              {/* Location Number Badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>
                  <div className="flex items-center space-x-2">
                    {isFullyBooked ? (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    ) : isLowAvailability ? (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  isFullyBooked 
                    ? "bg-red-500/20 text-red-300 border border-red-500/30" 
                    : isLowAvailability 
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                )}>
                  {isFullyBooked ? "Full" : isLowAvailability ? "Few Left" : "Available"}
                </div>
              </div>

              {/* Location Name */}
              <CardTitle className="text-white text-lg font-semibold flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="truncate">{getStreetFromAddress(loc.address)}</span>
              </CardTitle>
              
              {/* Full Address */}
              <CardDescription className="text-slate-400 text-sm leading-relaxed">
                {loc.address}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0 space-y-4">
              {/* Pricing and Availability Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 border border-slate-700/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 text-sm font-medium">Hourly Rate</span>
                  </div>
                  <p className="text-white font-semibold">
                    {formatAmountForDisplay(loc.price?.hourly!, 'INR')}
                  </p>
                </div>

                <div className="bg-slate-900/40 border border-slate-700/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Car className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-sm font-medium">Available</span>
                  </div>
                  <p className={cn(
                    "font-semibold",
                    isFullyBooked ? "text-red-400" : isLowAvailability ? "text-amber-400" : "text-emerald-400"
                  )}>
                    {availableSpots} / {loc.numberofspots} spots
                  </p>
                </div>
              </div>

              {/* Features for Indian market */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>Instant confirmation</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <CheckCircle className="w-3 h-3" />
                  <span>UPI & Card payments accepted</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <MapPin className="w-3 h-3" />
                  <span>Karnataka, India</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-700/50"></div>

              {/* Book Button */}
              {params && (
                <Link
                  className={cn(
                    "w-full inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-center",
                    isFullyBooked 
                      ? "bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600/30" 
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:scale-[1.02] active:scale-[0.98]"
                  )}
                  href={isFullyBooked ? '#' : `book/${loc.id}?date=${params.arrivingon}&starttime=${params.arrivingtime}&endtime=${params.leavingtime}`}
                  onClick={isFullyBooked ? (e) => e.preventDefault() : undefined}
                >
                  {isFullyBooked ? (
                    <span className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Fully Booked</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <Car className="w-4 h-4" />
                      <span>Reserve Spot</span>
                    </span>
                  )}
                </Link>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* No Results Message */}
      {parkingLocations.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">No parking spots found</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Try searching in other areas of Karnataka or adjust your timing.
          </p>
        </div>
      )}
    </div>
  )
}

export default SearchResult