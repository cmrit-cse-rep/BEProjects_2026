'use client'
import React, { useState } from 'react'
import SearchForm from './search-form'
import { LatLng, MapAddressType, MapParams } from '@/types'
import { findNearbyLocations } from '@/actions/actions'
import { ParkingLocation } from '@/schemas/parking-locations'
import Map from './map'
import SearchResult from './search-result'

export type SearchParams = {
  address: string,
  gpscoords: LatLng,
  arrivingon: Date,
  arrivingtime: Date,
  leavingtime: Date
}

function SearchComponent() {
  const [search, setSearch] = useState<MapParams[]>([])
  const [searchRadius, setSearchRadius] = useState(2000) // Increased for Indian cities
  const [message, setMessage] = useState("Enter a Karnataka address, date, time and click search")
  const [searchParams, setSearchParams] = useState<SearchParams | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const handleSearchDone = async (params: SearchParams) => {
    console.log(params)
    setMessage("Searching for available parking spots in Karnataka...")
    setIsLoading(true)
    setSearch([])
    
    try {
      const searchResult = await findNearbyLocations(searchRadius, params as SearchParams)
      const mapParams: MapParams[] = searchResult.map((loc: ParkingLocation) => ({
        address: loc.address,
        gpscoords: loc.gpscoords,
        price: loc.price,
        numberofspots: loc.numberofspots,
        bookedspots: loc.bookedspots,
        status: loc.status,
        type: MapAddressType.PARKINGLOCATION,
        id: loc._id
      }))
      
      if (mapParams.length > 0) {
        mapParams.unshift({
          address: params.address as string,
          gpscoords: params.gpscoords as LatLng,
          type: MapAddressType.DESTINATION,
          radius: searchRadius,
          id: ""
        })
        setSearch([...mapParams])
        setSearchParams(params)
        setMessage(`Found ${mapParams.length - 1} available parking spots near your destination`)
      } else {
        setMessage("No parking spots found nearby. Try expanding your search area or check popular locations in Bangalore, Mysore, or other Karnataka cities.")
      }
    } catch (error) {
      console.error('Search error:', error)
      setMessage("Search failed. Please check your internet connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Search Form Container */}
      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-900/50">
        <SearchForm onSearch={handleSearchDone} isLoading={isLoading} />
      </div>

      {/* Results Container */}
      {search.length > 0 ? (
        <div className="mt-8 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/50">
          {/* Results Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <h3 className="text-white font-semibold text-lg">Available in Karnataka</h3>
              </div>
              <div className="text-white/80 text-sm">
                {search.length - 1} spots found • {searchRadius/1000}km radius
              </div>
            </div>
          </div>

          {/* Results Content */}
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Search Results Sidebar */}
            <div className="lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-slate-700/50">
              <div className="p-4 h-full overflow-y-auto">
                <SearchResult 
                  locations={search} 
                  params={searchParams as SearchParams} 
                />
              </div>
            </div>
            
            {/* Map Container */}
            <div className="flex-1 relative min-h-[400px] lg:min-h-[600px]">
              <div className="absolute inset-0 bg-slate-900/20 rounded-br-3xl overflow-hidden">
                <Map mapParams={JSON.stringify(search)} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800/50 rounded-full border border-slate-700/50 mb-6">
            {isLoading ? (
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
          <p className="text-xl text-slate-300 font-medium mb-2">
            {isLoading ? "Searching..." : "Ready to find parking in Karnataka"}
          </p>
          <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">
            {message}
          </p>
          
          {!isLoading && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { city: "Bangalore", icon: "🏙️" },
                { city: "Mysore", icon: "🏛️" },
                { city: "Hubli", icon: "🏢" },
                { city: "Mangalore", icon: "🏖️" }
              ].map((location, index) => (
                <div key={index} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">{location.icon}</div>
                  <div className="text-slate-400 text-sm">{location.city}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchComponent