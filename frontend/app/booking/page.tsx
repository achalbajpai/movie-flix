'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SeatMap } from '@/components/seat-map'
import { CustomerForm, CustomerDetails, ContactDetails } from '@/components/customer-form'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/lib/auth-context'
import { useBooking } from '@/lib/hooks'
import { showApi } from '@/lib/api'
import { ArrowLeft, Film, Clock, MapPin, Star } from 'lucide-react'
import { toast } from 'sonner'

interface SelectedSeat {
  seatId: number
  seatNo: string
  price: number
}

interface Show {
  show_id: number
  show_time: string
  end_time: string
  base_price: number
  show_type: string
  movie_title: string
  theater_name: string
  screen_name: string
}

export default function BookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [show, setShow] = useState<Show | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([])
  const [currentStep, setCurrentStep] = useState<'seat-selection' | 'customer-details'>('seat-selection')

  const { createBooking, loading: bookingLoading } = useBooking()

  const showId = searchParams.get('showId')
  const movieId = searchParams.get('movieId')

  useEffect(() => {
    if (showId) {
      fetchShowDetails()
    } else if (movieId) {
      // Redirect to show selection if only movie ID is provided
      router.push(`/results?movieId=${movieId}`)
    } else {
      router.push('/results')
    }
  }, [showId, movieId, router])

  const fetchShowDetails = async () => {
    if (!showId) return

    try {
      setLoading(true)
      const response = await showApi.getById(parseInt(showId))

      if (response.success && response.data) {
        const showData: any = response.data
        // Transform the nested structure to flat structure expected by component
        setShow({
          show_id: showData.show_id,
          show_time: showData.show_time,
          end_time: showData.end_time,
          base_price: showData.base_price,
          show_type: showData.show_type,
          movie_title: showData.movie?.title || 'Unknown Movie',
          theater_name: showData.theater?.name || 'Unknown Theater',
          screen_name: showData.screen?.name || 'Unknown Screen'
        })
      } else {
        throw new Error(response.error?.message || 'Failed to load show details')
      }
    } catch (error) {
      console.error('Error fetching show details:', error)
      toast.error('Failed to load show details. Please try again.')
      router.push('/results?' + searchParams.toString())
    } finally {
      setLoading(false)
    }
  }

  const handleSeatSelectionChange = useCallback((seatIds: number[], totalPrice: number) => {
    if (!show) return

    const seats: SelectedSeat[] = seatIds.map(id => ({
      seatId: id,
      seatNo: `${id}`,
      price: show.base_price
    }))

    setSelectedSeats(seats)
  }, [show])

  const handleContinueToCustomerDetails = () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat')
      return
    }
    setCurrentStep('customer-details')
  }

  const handleSubmitBooking = async (customers: CustomerDetails[], contactDetails: ContactDetails) => {
    if (!show || !user || selectedSeats.length === 0) {
      toast.error('Missing required booking information')
      return
    }

    try {
      const bookingData = {
        userId: user.id,
        showId: show.show_id,
        seatIds: selectedSeats.map(seat => seat.seatId),
        customers: customers,
        contactDetails
      }

      const result = await createBooking(bookingData)

      if (result) {
        toast.success('Booking confirmed!')
        router.push(`/booking/confirmation?bookingId=${result.bookingId}`)
      } else {
        toast.error('Booking failed')
      }
    } catch (error) {
      toast.error('An error occurred while creating the booking')
    }
  }

  const handleBack = () => {
    if (currentStep === 'customer-details') {
      setCurrentStep('seat-selection')
    } else {
      router.back()
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading show details...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!show) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Show Not Found</h3>
              <p className="text-muted-foreground mb-4">The requested show could not be found.</p>
              <Button onClick={() => router.push('/results')}>
                Back to Search
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Film className="h-6 w-6" />
                  {show.movie_title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {show.theater_name} - {show.screen_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(show.show_time).toLocaleString()}
                  </span>
                  <Badge variant="outline">{show.show_type}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {currentStep === 'seat-selection' ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Your Seats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SeatMap
                      showId={show.show_id}
                      userId={user?.id || ''}
                      onSelectionChange={handleSeatSelectionChange}
                    />
                  </CardContent>
                </Card>
              ) : (
                <CustomerForm
                  selectedSeats={selectedSeats}
                  onSubmit={handleSubmitBooking}
                  loading={bookingLoading}
                />
              )}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Selected Seats</h4>
                    {selectedSeats.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedSeats.map(seat => (
                          <Badge key={seat.seatId} variant="secondary">
                            {seat.seatNo}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No seats selected</p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tickets ({selectedSeats.length})</span>
                      <span>₹{selectedSeats.reduce((sum, seat) => sum + seat.price, 0)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>₹{selectedSeats.reduce((sum, seat) => sum + seat.price, 0)}</span>
                    </div>
                  </div>

                  {currentStep === 'seat-selection' && (
                    <Button
                      className="w-full"
                      onClick={handleContinueToCustomerDetails}
                      disabled={selectedSeats.length === 0}
                    >
                      Continue
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
