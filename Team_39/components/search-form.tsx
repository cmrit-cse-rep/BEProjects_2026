import React, { useEffect } from 'react'
import { Input } from './ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form'
import { Label } from './ui/label'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import DateSelect from './date-select'
import TimeSelect from './time-select'
import { LatLng } from '@/types'
import AddressAutoCompleteInput from './address-autocomplete.input'
import { format } from 'date-fns'
import { Search, MapPin, Calendar, Clock } from 'lucide-react'

const FormSchema = z.object({
  address: z.string().min(5, {
    message: "Please enter a valid Karnataka address"
  }),
  arrivingon: z.date({
    required_error: "Date is required"
  }),
  gpscoords: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  arrivingtime: z.string({
    required_error: "Arrival time is required"
  }),
  leavingtime: z.string({
    required_error: "Departure time is required"
  })
})

function SearchForm({
  onSearch,
  isLoading = false
}: {
  onSearch: (data: any) => void,
  isLoading?: boolean
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      leavingtime: ''
    }
  })

  const arrivingTime = useWatch({
    control: form.control,
    name: 'arrivingtime'
  })

  useEffect(() => {
    if (arrivingTime) {
      form.resetField('leavingtime')
    }
  }, [arrivingTime, form])

  function onSubmit(formData: z.infer<typeof FormSchema>) {
    const data = { ...formData, arrivingon: format(formData.arrivingon, 'yyyy-MM-dd')}
    onSearch(data)
  }

  const handleAddressSelect = (address: string, gpscoords: LatLng) => {
    form.setValue('address', address)
    form.setValue('gpscoords', gpscoords)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Find Parking in Karnataka
        </h2>
        <p className="text-slate-400 text-lg">
          Search for available spots in Bangalore, Mysore, Hubli, and more
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Address Input */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-white font-medium flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Where are you going?</span>
                </FormLabel>
                <FormControl>
                  <AddressAutoCompleteInput
                    onAddressSelect={handleAddressSelect}
                    selectedAddress={field.value || ''}
                    value={field.value || ''}
                    onChange={field.onChange}
                    error={form.formState.errors.address?.message}
                  />
                </FormControl>
                {form.formState.errors.address && (
                  <p className="text-xs text-red-400 mt-1">
                    {form.formState.errors.address.message}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Try: Commercial Street Bangalore, Brigade Road, Infosys Mysore, etc.
                </p>
              </FormItem>
            )}
          />

          {/* GPS Coordinates are set via handleAddressSelect callback - no hidden field needed */}

          {/* Date and Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Date Field */}
            <FormField
              control={form.control}
              name='arrivingon'
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-white font-medium flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Date</span>
                  </FormLabel>
                  <FormControl>
                    <DateSelect field={field} disableDates={true} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Arrival Time */}
            <FormField
              control={form.control}
              name='arrivingtime'
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-white font-medium flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>Arriving At</span>
                  </FormLabel>
                  <FormControl>
                    <TimeSelect onChange={field.onChange} defaultValue={field.value} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Departure Time */}
            <FormField
              control={form.control}
              name='leavingtime'
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-white font-medium flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>Leaving At</span>
                  </FormLabel>
                  <FormControl>
                    <TimeSelect
                      disableTime={form.getValues('arrivingtime')}
                      onChange={field.onChange}
                      defaultValue={field.value} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Search Button */}
          <div className="pt-4">
            <Button 
              type='submit' 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex items-center justify-center space-x-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching Karnataka...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Find Parking Spots</span>
                  </>
                )}
              </div>
            </Button>
          </div>

          {/* Quick Tips - Updated for India */}
          <div className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-4 mt-6">
            <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span>Helpful Tips</span>
            </h4>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• Book 15-30 minutes before arrival for best rates</li>
              <li>• Have your vehicle registration number ready (e.g., KA01AB1234)</li>
              <li>• UPI payments get instant confirmation</li>
              <li>• Peak hours: 9-11 AM and 6-8 PM have higher demand</li>
            </ul>
          </div>

          {/* Popular Locations Quick Access */}
          <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4">
            <h4 className="text-emerald-300 font-medium mb-3">Popular Karnataka Destinations</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                "MG Road, Bangalore",
                "Brigade Road, Bangalore", 
                "Mysore Palace",
                "Forum Mall, Bangalore"
              ].map((location, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    form.setValue('address', location)
                    // You would typically also set GPS coordinates here
                  }}
                  className="text-xs bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white px-2 py-1 rounded-lg transition-colors"
                >
                  {location}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default SearchForm