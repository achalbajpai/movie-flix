'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useBooking } from '@/lib/hooks'
import { BookingResponse } from '@/lib/api'
import {
  CheckCircle,
  Download,
  Mail,
  Phone,
  MapPin,
  Clock,
  Users,
  IndianRupee,
  Calendar,
  Home,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [booking, setBooking] = useState<BookingResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const { getBooking } = useBooking()

  const bookingId = searchParams.get('bookingId')

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails()
    } else {
      router.push('/')
    }
  }, [bookingId, router])

  const fetchBookingDetails = async () => {
    if (!bookingId) return

    try {
      setLoading(true)
      const bookingData = await getBooking(bookingId)
      if (bookingData) {
        setBooking(bookingData)
      } else {
        toast.error('Booking not found')
        router.push('/')
      }
    } catch (error) {
      toast.error('Failed to load booking details')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTicket = async () => {
    if (!bookingId) return

    try {
      const { api } = await import('@/lib/api/simplified')
      await api.downloadTicket(bookingId)
      toast.success('Ticket downloaded successfully')
    } catch (error) {
      console.error('Error downloading ticket:', error)
      toast.error('Failed to download ticket')
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handleViewBookings = () => {
    router.push('/bookings')
  }

  if (loading || !booking) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardContent className="p-8">
                <div className="space-y-4 animate-pulse">
                  <div className="h-8 bg-muted rounded w-64 mx-auto"></div>
                  <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
                  <div className="h-64 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-800 mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-green-700">
              Your movie tickets have been booked successfully.
              Confirmation details have been sent to your email and phone.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Booking Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Booking ID</p>
                <p className="font-mono text-lg font-semibold">{booking.id}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge
                  variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {booking.status}
                </Badge>
                <Badge variant="outline">
                  ₹{booking.totalAmount}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Show Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Movie</p>
                      <p className="font-medium">{booking.show?.movieTitle || 'Movie not available'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Show Date</p>
                      <p className="font-medium">
                        {booking.showDate ? new Date(booking.showDate).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Date not available'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Show Time</p>
                      <p className="font-medium">{booking.show?.showTime || 'Time not available'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Theater</p>
                      <p className="font-medium">{booking.show?.theaterName || 'Unknown Theater'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Customer Information</h3>

              <div className="space-y-3">
                {booking.customers?.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">
                        Seat {booking.seats?.[index]?.seatNo || `${index + 1}`}
                      </Badge>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.age} years, {customer.gender}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-sm font-medium">
                      <IndianRupee className="h-3 w-3" />
                      {booking.seats?.[index]?.price || booking.totalAmount / (booking.customers?.length || 1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Contact Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{booking.contactDetails?.email || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{booking.contactDetails?.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold">Payment Summary</h3>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Base Fare ({booking.customers?.length || 0} customer{(booking.customers?.length || 0) > 1 ? 's' : ''})</span>
                  <span>₹{booking.totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxes & Fees</span>
                   <span className="flex items-center">
                    <IndianRupee className="h-4 w-4" />
                    {booking.fees}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span className="flex items-center">
                    <IndianRupee className="h-4 w-4" />
                    {booking.totalAmount + (booking.fees || 0)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Important Information</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Please arrive at the theater at least 15 minutes before show time</p>
              <p>• Carry a valid photo ID proof for entry</p>
              <p>• Cancellation charges may apply as per the theater's policy</p>
              <p>• For any queries, contact customer support or the theater</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleDownloadTicket}
            size="lg"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Ticket
          </Button>

          <Button
            variant="outline"
            onClick={handleViewBookings}
            size="lg"
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            View All Bookings
          </Button>

          <Button
            variant="ghost"
            onClick={handleGoHome}
            size="lg"
          >
            <Home className="h-4 w-4 mr-2" />
            Book Another Movie
          </Button>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}