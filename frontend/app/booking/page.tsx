'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SeatMap } from '@/components/seat-map'
import { PassengerForm, PassengerDetails, ContactDetails } from '@/components/passenger-form'
import { useBooking } from '@/lib/hooks'
import { Bus, api } from '@/lib/api'
import { DEV_CONFIG, ERROR_MESSAGES } from '@/lib/constants'
import { ArrowLeft, MapPin, Clock, Users, Star } from 'lucide-react'
import { toast } from 'sonner'

interface SelectedSeat {
  seatId: number
  seatNo: string
  price: number
}

export default function BookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [bus, setBus] = useState<Bus | null>(null)
  const [loading, setBusLoading] = useState(true)
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([])
  const [currentStep, setCurrentStep] = useState<'seat-selection' | 'passenger-details'>('seat-selection')

  const { createBooking, loading: bookingLoading } = useBooking()

  const busId = searchParams.get('busId')
  const scheduleIdParam = searchParams.get('scheduleId') || searchParams.get('routeId')
  const scheduleId = scheduleIdParam ? parseInt(scheduleIdParam) : null
  const from = searchParams.get('source') || searchParams.get('from') // Try both parameter names
  const to = searchParams.get('destination') || searchParams.get('to') // Try both parameter names
  const date = searchParams.get('departureDate') || searchParams.get('date') // Try both parameter names


  useEffect(() => {
    if (busId) {
      fetchBusDetails()
    } else {
      router.push('/results')
    }
  }, [busId, router])

  const fetchBusDetails = async () => {
    if (!busId) return

    try {
      setBusLoading(true)

      // Check if we have required search parameters
      if (!from || !to || !date) {
        toast.error('Missing search parameters. Please search for buses again.')
        router.push('/results')
        return
      }

      // Try to search for buses with the provided parameters
      const searchResults = await api.searchBuses({
        source: from,
        destination: to,
        departureDate: date,
        passengers: 1
      })

      if (searchResults.success && searchResults.data) {
        // searchResults.data is a PaginatedResponse, so the buses are in searchResults.data.data
        const buses = searchResults.data.data || []
        const foundBus = buses.find(b => b.id === busId)
        if (foundBus) {
          // Validate that the bus has a valid schedule ID
          if (!foundBus.id || isNaN(parseInt(foundBus.id))) {
            toast.error(ERROR_MESSAGES.INVALID_SCHEDULE)
            router.push('/results?' + searchParams.toString())
            return
          }
          setBus(foundBus)
        } else {
          toast.error('Bus not found in search results')
          router.push('/results?' + searchParams.toString())
        }
      } else {
        throw new Error(searchResults.error?.message || 'Failed to search buses')
      }
    } catch (error) {
      toast.error('Failed to load bus details. Please try again.')
      // Redirect back to results with the original search parameters
      router.push('/results?' + searchParams.toString())
    } finally {
      setBusLoading(false)
    }
  }

  const handleSeatSelectionChange = useCallback((seatIds: number[], totalPrice: number) => {
    if (!bus) return

    // Convert seat IDs to SelectedSeat objects
    // For now, we'll use the seat ID as seat number and bus price
    // In a real implementation, this would come from the seat selection hook
    const seats: SelectedSeat[] = seatIds.map(id => ({
      seatId: id,
      seatNo: `${id}`, // This should come from the actual seat data
      price: bus.price // This should come from the actual seat pricing
    }))

    setSelectedSeats(seats)
  }, [bus])

  const handleContinueToPassengerDetails = () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat')
      return
    }
    setCurrentStep('passenger-details')
  }

  const handleBackToSeatSelection = () => {
    setCurrentStep('seat-selection')
  }

  const handleBookingSubmit = async (passengers: PassengerDetails[], contactDetails: ContactDetails) => {
    if (!bus) {
      toast.error('Missing booking information')
      return
    }

    // Use bus.id as scheduleId since bus.id is actually the schedule_id from the database
    const actualScheduleId = parseInt(bus.id)

    try {
      const bookingData = {
        busId: bus.id,
        scheduleId: actualScheduleId,
        seatIds: selectedSeats.map(seat => seat.seatId),
        passengers,
        contactDetails
      }

      const booking = await createBooking(bookingData)

      if (booking) {
        toast.success('Booking created successfully!')
        router.push(`/booking/confirmation?bookingId=${booking.id}`)
      }
    } catch (error) {
      toast.error('Failed to create booking. Please try again.')
    }
  }

  const goBack = () => {
    const backUrl = new URL('/results', window.location.origin)
    searchParams.forEach((value, key) => {
      if (key !== 'busId' && key !== 'scheduleId') {
        backUrl.searchParams.set(key, value)
      }
    })
    router.push(backUrl.toString())
  }

  if (loading || !bus) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
          <Card>
            <CardContent className="p-8">
              <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-64 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={goBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results
        </Button>

        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">Book Your Journey</h1>
          <div className="flex items-center space-x-4 text-muted-foreground">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{from} → {to}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{date}</span>
            </div>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{bus.operatorName}</h3>
                  <p className="text-muted-foreground">{bus.busType.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{bus.operatorRating.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold">{bus.departureTime}</div>
                  <div className="text-xs text-muted-foreground">Departure</div>
                </div>

                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 border-t border-dashed"></div>
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {Math.floor(bus.duration / 60)}h {bus.duration % 60}m
                  </div>
                  <div className="flex-1 border-t border-dashed"></div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold">{bus.arrivalTime}</div>
                  <div className="text-xs text-muted-foreground">Arrival</div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-bold">₹{bus.price}</div>
              <div className="text-xs text-muted-foreground">
                <Users className="h-3 w-3 inline mr-1" />
                {bus.availableSeats} seats left
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'seat-selection' ? 'bg-primary text-primary-foreground' : 'bg-green-500 text-white'
            }`}>
              1
            </div>
            <span className={currentStep === 'seat-selection' ? 'font-medium' : 'text-muted-foreground'}>
              Select Seats
            </span>
          </div>

          <Separator className="flex-1" />

          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'passenger-details' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <span className={currentStep === 'passenger-details' ? 'font-medium' : 'text-muted-foreground'}>
              Passenger Details
            </span>
          </div>
        </div>
      </div>

      {currentStep === 'seat-selection' && (
        <div className="space-y-6">
          {bus && bus.id ? (
            <SeatMap
              scheduleId={parseInt(bus.id)} // Use bus.id as scheduleId since it's actually the schedule_id
              userId={DEV_CONFIG.MOCK_USER_ID} // TODO: Get from auth context when implemented
              onSeatSelectionChange={handleSeatSelectionChange}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">{ERROR_MESSAGES.INVALID_SCHEDULE}</p>
              </CardContent>
            </Card>
          )}

          {selectedSeats.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Seats: {selectedSeats.map(s => s.seatNo).join(', ')}
                    </p>
                  </div>
                  <Button
                    onClick={handleContinueToPassengerDetails}
                    size="lg"
                  >
                    Continue to Passenger Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {currentStep === 'passenger-details' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="font-medium">
                    {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Seats: {selectedSeats.map(s => s.seatNo).join(', ')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleBackToSeatSelection}
                >
                  Change Seats
                </Button>
              </div>
            </CardContent>
          </Card>

          <PassengerForm
            selectedSeats={selectedSeats}
            onSubmit={handleBookingSubmit}
            loading={bookingLoading}
          />
        </div>
      )}
    </div>
  )
}