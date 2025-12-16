'use client'

import { buildMapInfoCardContent, buildMapInfoCardContentForDestination, destinationPin, getStreetFromAddress, parkingPin, parkingPinWithIndex } from "@/lib/utils"
import { MapAddressType, MapParams } from "@/types"
import { useJsApiLoader } from "@react-google-maps/api"
import { useEffect, useMemo, useRef } from "react"
import { GOOGLE_MAPS_LIBRARIES } from "@/lib/google-maps"

function Map({ mapParams }: { mapParams: string}) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<google.maps.Map | null>(null)
    const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
    const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)

    // Get API key from environment - DO NOT use fallbacks or hardcoded keys
    const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY;

    // Parse and validate mapParams with useMemo to handle updates
    const params = useMemo(() => {
        try {
            const parsed = JSON.parse(mapParams) as MapParams[]
            if (!parsed || parsed.length === 0) {
                return null
            }
            return parsed
        } catch (error) {
            console.error('Error parsing mapParams:', error)
            return null
        }
    }, [mapParams])

    // Only load Google Maps if API key is provided - fail fast if missing
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey || '', // Will show error if undefined
        libraries: GOOGLE_MAPS_LIBRARIES,
    })

    const getPinType = (loc: MapParams): string => {
        return loc.type === MapAddressType.DESTINATION ? 'parking_destination_tr' : 'parking_pin_tr'
    }

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') {
            return;
        }

        if (!isLoaded || !apiKey || loadError || !params || params.length === 0 || !mapRef.current) {
            if (loadError) {
                console.error('Error loading Google Maps:', loadError);
            }
            return;
        }

        // Ensure google.maps exists
        if (!window.google || !window.google.maps) {
            console.error('Google Maps API not available');
            return;
        }

        try {
            const mapOptions: google.maps.MapOptions = {
                center: {
                    lat: params[0].gpscoords.lat,
                    lng: params[0].gpscoords.lng
                },
                zoom: 14,
                // Remove mapId if not configured - AdvancedMarkerElement can work without it
                // mapId: 'MY-MAP-ID-1234' // Only use if you've created a Map ID in Google Cloud Console
            }

            const gMap = new window.google.maps.Map(mapRef.current as HTMLDivElement, mapOptions)
            mapInstanceRef.current = gMap;

            // Create info window
            infoWindowRef.current = new window.google.maps.InfoWindow({
                maxWidth: 200
            });

            // Clear previous markers
            markersRef.current.forEach(marker => {
                marker.map = null;
            });
            markersRef.current = [];

            // Create markers
            params.forEach((loc, index) => {
                try {
                    const marker = new window.google.maps.marker.AdvancedMarkerElement({
                        map: gMap,
                        position: loc.gpscoords,
                        title: loc.address
                    });

                    markersRef.current.push(marker);

                    if (loc.type === MapAddressType.PARKINGLOCATION) {
                        marker.setAttribute("content", buildMapInfoCardContent(
                            getStreetFromAddress(loc.address),
                            loc.address,
                            loc.numberofspots as number,
                            loc.price?.hourly as number
                        ));
                        marker.content = parkingPinWithIndex(getPinType(loc), index).element;
                    } else if(loc.type === MapAddressType.ADMIN) {
                        marker.setAttribute("content", buildMapInfoCardContent(
                            getStreetFromAddress(loc.address),
                            loc.address,
                            loc.numberofspots as number,
                            loc.price?.hourly as number
                        ));
                        marker.content = parkingPin(getPinType(loc)).element;
                    } else {
                        const cityCircle = new window.google.maps.Circle({
                            strokeColor: '#00FF00',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            fillColor: '#0FF000',
                            fillOpacity: 0.35,
                            map: gMap,
                            center: {
                                lat: params[0].gpscoords.lat,
                                lng: params[0].gpscoords.lng
                            },
                            radius: loc.radius || 1000
                        });

                        marker.content = destinationPin(getPinType(loc)).element;
                        marker.setAttribute("content", buildMapInfoCardContentForDestination(
                            getStreetFromAddress(loc.address), 
                            loc.address
                        ));
                    }

                    marker.addListener('click', () => {
                        if (infoWindowRef.current) {
                            infoWindowRef.current.close();
                            infoWindowRef.current.setContent(marker.getAttribute('content'));
                            infoWindowRef.current.open({
                                map: gMap,
                                anchor: marker
                            });
                        }
                    });
                } catch (error) {
                    console.error(`Error creating marker for ${loc.address}:`, error);
                }
            });
        } catch (error) {
            console.error('Error initializing map:', error);
        }

        // Cleanup function
        return () => {
            // Clear markers
            markersRef.current.forEach(marker => {
                marker.map = null;
            });
            markersRef.current = [];
            
            // Close info window
            if (infoWindowRef.current) {
                infoWindowRef.current.close();
                infoWindowRef.current = null;
            }

            // Clear map instance
            mapInstanceRef.current = null;
        };
    }, [isLoaded, apiKey, loadError, params, mapParams]);

    // Early return if params is invalid
    if (!params || params.length === 0) {
        return <div className="p-4 text-slate-400">No locations to display on map</div>
    }

    if (!apiKey) {
        return (
            <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
                <p className="text-red-400 font-semibold mb-2">Google Maps API Key Not Configured</p>
                <p className="text-red-300 text-sm">
                    Please set <code className="bg-red-900/50 px-1 rounded">NEXT_PUBLIC_MAPS_API_KEY</code> in your Vercel environment variables.
                </p>
            </div>
        )
    }

    if (loadError) {
        const errorMessage = loadError.message || 'Unknown error';
        const isAuthError = errorMessage.includes('Do you own this website') || errorMessage.includes('refererNotAllowedMapError');
        
        return (
            <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
                <p className="text-red-400 font-semibold mb-2">Error Loading Google Maps</p>
                <p className="text-red-300 text-sm mb-2">{errorMessage}</p>
                {isAuthError && (
                    <div className="mt-3 p-3 bg-red-900/30 rounded border border-red-600">
                        <p className="text-red-200 text-xs font-semibold mb-1">Common Fixes:</p>
                        <ul className="text-red-300 text-xs space-y-1 list-disc list-inside">
                            <li>Check API key restrictions in Google Cloud Console</li>
                            <li>Add your Vercel domain to HTTP referrer restrictions: <code className="bg-red-900/50 px-1 rounded">*.vercel.app/*</code></li>
                            <li>Ensure Maps JavaScript API and Places API are enabled</li>
                            <li>Verify billing is enabled in Google Cloud Console</li>
                        </ul>
                    </div>
                )}
            </div>
        )
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <p className="text-slate-400">Loading map...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col space-y-4">
            <div style={{ height: '600px', width: '100%' }} ref={mapRef} />
        </div>
    )
}

export default Map