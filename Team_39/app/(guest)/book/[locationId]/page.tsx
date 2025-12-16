'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { getParkingLocation } from '@/actions/actions'
import { createCheckoutSession } from '@/actions/stripe'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectSeparator } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { formatAmountForDisplay, getStreetFromAddress } from '@/lib/utils'
import { ParkingLocation } from '@/schemas/parking-locations'
import { zodResolver } from '@hookform/resolvers/zod'
import { differenceInMinutes, format } from 'date-fns'
import { ArrowRight, Loader, MapPin, Clock, CreditCard, Car } from 'lucide-react'
import { useParams, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const FormSchema = z.object({
  plateno: z.string().min(4, {
    message: 'Vehicle number must be at least 4 characters.'
  }).max(15, {
    message: 'Vehicle number cannot exceed 15 characters.'
  }).regex(/^[A-Z0-9\s]+$/, {
    message: 'Please enter a valid Indian vehicle number (e.g., KA01AB1234)'
  })
})

function BookPage() {
  const [loading, setLoading] = useState(false)
  const params = useParams<{ locationId: string }>()
  const locationId = params.locationId
  const searchParams = useSearchParams()
  const date = searchParams.get('date')
  const startTime = searchParams.get('starttime')
  const endTime = searchParams.get('endtime')
  const [location, setLocation] = useState<ParkingLocation>()

  const diffInHours = useMemo(() => 
    differenceInMinutes(new Date(`${date}T${endTime}`), new Date(`${date}T${startTime}`)) / 60
  , [date, startTime, endTime])

  useEffect(() => {
    (async () => {
      const location = await getParkingLocation(locationId)
      setLocation(location as ParkingLocation)
    })()
  }, [locationId])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      plateno: ''
    }
  })

  async function onSubmit(formData: z.infer<typeof FormSchema>) {
    setLoading(true)
    try {
      const fd = new FormData()
      const amount = diffInHours * location?.price.hourly!
      fd.append('address', getStreetFromAddress(location?.address!))
      fd.append('amount', `${amount}`)
      fd.append('locationid', `${location?._id}`)
      fd.append('bookingdate', date!)
      fd.append('starttime', startTime!)
      fd.append('endtime', endTime!)
      fd.append('plate', formData.plateno.toUpperCase())
      
      await createCheckoutSession(fd)
    } catch (error) {
      console.error('Booking error:', error)
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
      <main className="sm:-mt-16 sm:container mx-auto px-4 flex flex-col items-center py-8">
        {/* Booking Header */}
        <div className="w-full max-w-2xl mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
              Complete Your Booking
            </h1>
            <p className="text-slate-400">Secure your parking spot in Karnataka</p>
          </div>

          {/* Time Summary Card */}
          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2 text-emerald-400">
                  <ArrowRight className='w-4 h-4' />
                  <span className="font-medium">Check-in</span>
                </div>
                <p className="text-white font-semibold">
                  {format(new Date(`${date}T${startTime}`), 'MMM dd, yyyy')}
                </p>
                <p className="text-slate-300 text-sm">
                  {format(new Date(`${date}T${startTime}`), 'HH:mm')}
                </p>
              </div>
              
              <div className="flex justify-center">
                <Separator className='bg-slate-600 w-12 sm:w-px sm:h-12' orientation='horizontal' />
              </div>
              
              <div className="space-y-1 text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-end space-x-2 text-red-400">
                  <span className="font-medium">Check-out</span>
                  <ArrowRight className='w-4 h-4' />
                </div>
                <p className="text-white font-semibold">
                  {format(new Date(`${date}T${endTime}`), 'MMM dd, yyyy')}
                </p>
                <p className="text-slate-300 text-sm">
                  {format(new Date(`${date}T${endTime}`), 'HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 w-full max-w-2xl rounded-2xl p-8 shadow-2xl space-y-6'>
            {/* Location Info */}
            <div className="border-b border-slate-700/50 pb-6">
              <div className="flex items-center space-x-3 mb-3">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <h2 className='font-bold text-2xl text-white'>
                  {location ? getStreetFromAddress(location.address) : 'Loading...'}
                </h2>
              </div>
              {location && (
                <p className="text-slate-400 ml-8">{location.address}</p>
              )}
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-slate-900/40 border border-slate-700/30 rounded-xl p-6 space-y-4">
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Pricing Details</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-slate-300">
                  <span>Hourly rate</span>
                  <span className="font-medium">
                    {location ? formatAmountForDisplay(location.price.hourly, 'INR') : '...'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Duration</span>
                  <span className="font-medium">{diffInHours} hours</span>
                </div>
                <Separator className="bg-slate-700/50" />
                <div className="flex justify-between text-white font-semibold text-lg">
                  <span>Total Amount</span>
                  <span className="text-emerald-400">
                    {location ? formatAmountForDisplay(diffInHours * location.price.hourly, 'INR') : '...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle Number Input */}
            <FormField
              control={form.control}
              name='plateno'
              render={({ field}) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-white font-semibold flex items-center space-x-2">
                    <Car className="w-4 h-4 text-emerald-400" />
                    <span>Vehicle Number</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      className='uppercase text-lg font-mono tracking-wider' 
                      placeholder='KA01AB1234' 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-slate-400">
                    Enter your vehicle registration number as it appears on your vehicle. 
                    This must match exactly to avoid penalties or towing.
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Payment Info */}
            <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-emerald-400 mb-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Payment Information</span>
              </div>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Secure payment processing with Stripe</li>
                <li>• UPI, Cards, and Net Banking accepted</li>
                <li>• Instant booking confirmation</li>
                <li>• GST included in the displayed price</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Proceed to Payment</span>
                </div>
              )}
            </Button>
          </form>
        </Form>
      </main>
      
      <section className='mt-16'>
        <Footer />
      </section>
    </div>
  )
}

export default BookPage