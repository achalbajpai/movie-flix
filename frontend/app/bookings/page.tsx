'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useBooking } from '@/lib/hooks'
import { BookingResponse } from '@/lib/api'
import { DEV_CONFIG } from '@/lib/constants'
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  IndianRupee,
  Search,
  Filter,
  Download,
  X,
  FileText,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

type BookingStatus = 'all' | 'confirmed' | 'cancelled' | 'completed'

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus>('all')

  const { getUserBookings, cancelBooking } = useBooking()

  useEffect(() => {
    fetchUserBookings()
  }, [])

  const fetchUserBookings = async () => {
    try {
      setLoading(true)
      // TODO: This should use actual user ID from authentication context
      const userBookings = await getUserBookings(DEV_CONFIG.MOCK_USER_ID)
      setBookings(userBookings)
    } catch (error) {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.bus.operatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.bus.route.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const canCancelBooking = (booking: BookingResponse) => {
    const journeyDate = new Date(booking.journeyDate)
    const now = new Date()
    const timeDifference = journeyDate.getTime() - now.getTime()
    const hoursDifference = timeDifference / (1000 * 3600)

    // Allow cancellation if booking is confirmed and journey is more than 2 hours away
    return booking.status === 'confirmed' && hoursDifference > 2
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? Cancellation charges may apply.')) {
      return
    }

    try {
      await cancelBooking(bookingId)
      toast.success('Booking cancelled successfully')
      fetchUserBookings() // Refresh the list
    } catch (error) {
      toast.error('Failed to cancel booking')
    }
  }

  const handleViewBooking = (bookingId: string) => {
    router.push(`/booking/confirmation?bookingId=${bookingId}`)
  }

  const handleDownloadTicket = (bookingId: string) => {
    // TODO: Implement ticket download functionality
    toast.success('Ticket download functionality will be implemented')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">My Bookings</h1>
            <p className="text-muted-foreground">View and manage your bus bookings</p>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4 animate-pulse">
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">View and manage your bus bookings</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by booking ID, operator, or route..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {(['all', 'confirmed', 'cancelled', 'completed'] as BookingStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="capitalize"
                  >
                    {status === 'all' ? 'All' : status}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? 'No bookings match your search criteria.'
                  : "You haven't made any bookings yet. Start planning your next journey!"}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => router.push('/')}>
                  Book Your First Trip
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg">{booking.bus.operatorName}</h3>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            Booking ID: {booking.id}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{booking.bus.route}</p>
                            <p className="text-xs text-muted-foreground">Route</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {new Date(booking.journeyDate).toLocaleDateString('en-IN')}
                            </p>
                            <p className="text-xs text-muted-foreground">Journey Date</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{booking.bus.departureTime}</p>
                            <p className="text-xs text-muted-foreground">Departure</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {booking.passengers.length} passenger{booking.passengers.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="text-sm">
                            Seats: {booking.seats.map(seat => seat.seatNo).join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col items-center lg:items-end gap-4 lg:gap-3">
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-xl font-bold">
                          <IndianRupee className="h-5 w-5" />
                          <span>{booking.totalAmount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                      </div>

                      <div className="flex flex-col gap-2 min-w-0">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBooking(booking.id)}
                            className="flex-1"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>

                          {booking.status === 'confirmed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadTicket(booking.id)}
                              className="flex-1"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Ticket
                            </Button>
                          )}
                        </div>

                        {canCancelBooking(booking) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            className="w-full"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        )}

                        {booking.status === 'cancelled' && (
                          <div className="flex items-center space-x-1 text-xs text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>Cancelled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredBookings.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing {filteredBookings.length} booking{filteredBookings.length > 1 ? 's' : ''}</span>
                <div className="flex items-center space-x-4">
                  <span>Total spent: ₹{filteredBookings.reduce((sum, booking) => sum + booking.totalAmount, 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}