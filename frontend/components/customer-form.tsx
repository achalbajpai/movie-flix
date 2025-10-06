'use client'

import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { User, Phone, Mail, AlertCircle, IndianRupee } from 'lucide-react'

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  age: z.number().min(1, 'Age must be at least 1').max(120, 'Age must be valid'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' })
})

const contactSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number is too long')
})

const customerFormSchema = z.object({
  customers: z.array(customerSchema),
  contactDetails: contactSchema
})

type CustomerFormData = z.infer<typeof customerFormSchema>

export interface CustomerDetails {
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
}

export interface ContactDetails {
  email: string
  phone: string
}

interface CustomerFormProps {
  selectedSeats: Array<{
    seatId: number
    seatNo: string
    price: number
  }>
  onSubmit: (customers: CustomerDetails[], contactDetails: ContactDetails) => Promise<void>
  loading?: boolean
  className?: string
}

export function CustomerForm({ selectedSeats, onSubmit, loading = false, className }: CustomerFormProps) {
  const { user } = useAuth()

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      customers: selectedSeats.map(() => ({
        name: '',
        age: 0,
        gender: 'male' as const
      })),
      contactDetails: {
        email: '',
        phone: ''
      }
    },
    mode: 'onBlur'
  })

  // Auto-populate contact details from user profile
  useEffect(() => {
    if (user) {
      setValue('contactDetails.email', user.email || '')
      // Extract name from user metadata if available
      const userName = user.user_metadata?.full_name || user.user_metadata?.name
      if (userName) {
        setValue('customers.0.name', userName)
      }
    }
  }, [user, setValue])

  const watchedCustomers = watch('customers')

  const onFormSubmit = async (data: CustomerFormData) => {
    await onSubmit(data.customers, data.contactDetails)
  }

  const getTotalPrice = () => {
    return selectedSeats.reduce((total, seat) => total + seat.price, 0)
  }

  if (selectedSeats.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-orange-500 mx-auto" />
            <h3 className="font-semibold">No Seats Selected</h3>
            <p className="text-muted-foreground text-sm">
              Please select seats before proceeding with customer details.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Selected Seats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((seat) => (
                  <Badge key={seat.seatId} variant="secondary" className="space-x-1">
                    <span>{seat.seatNo}</span>
                    <span>-</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-3 w-3" />
                      {seat.price}
                    </span>
                  </Badge>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount:</span>
                <div className="flex items-center space-x-1 text-lg font-bold text-primary">
                  <IndianRupee className="h-4 w-4" />
                  <span>{getTotalPrice()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedSeats.map((seat, index) => (
              <div key={seat.seatId} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Seat {seat.seatNo}</Badge>
                  <h4 className="font-semibold">Customer {index + 1}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`customers.${index}.name`}>
                      Full Name *
                    </Label>
                    <Input
                      {...register(`customers.${index}.name`)}
                      placeholder="Enter full name"
                      className={errors.customers?.[index]?.name ? 'border-red-500' : ''}
                    />
                    {errors.customers?.[index]?.name && (
                      <p className="text-red-500 text-sm">
                        {errors.customers[index].name?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`customers.${index}.age`}>
                      Age *
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      {...register(`customers.${index}.age`, {
                        valueAsNumber: true
                      })}
                      placeholder="Age"
                      className={errors.customers?.[index]?.age ? 'border-red-500' : ''}
                    />
                    {errors.customers?.[index]?.age && (
                      <p className="text-red-500 text-sm">
                        {errors.customers[index].age?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Controller
                      name={`customers.${index}.gender`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className={errors.customers?.[index]?.gender ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.customers?.[index]?.gender && (
                      <p className="text-red-500 text-sm">
                        {errors.customers[index].gender?.message}
                      </p>
                    )}
                  </div>
                </div>

                {watchedCustomers[index]?.age && watchedCustomers[index]?.age > 0 && watchedCustomers[index]?.age < 12 && (
                  <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Child Ticket</p>
                      <p>Children under 12 years may have special ticket pricing or requirements.</p>
                    </div>
                  </div>
                )}

                {index < selectedSeats.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactDetails.email" className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>Email Address *</span>
                </Label>
                <Input
                  type="email"
                  {...register('contactDetails.email')}
                  placeholder="your.email@example.com"
                  className={errors.contactDetails?.email ? 'border-red-500' : ''}
                />
                {errors.contactDetails?.email && (
                  <p className="text-red-500 text-sm">
                    {errors.contactDetails.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactDetails.phone" className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>Phone Number *</span>
                </Label>
                <Input
                  type="tel"
                  {...register('contactDetails.phone')}
                  placeholder="+91 98765 43210"
                  className={errors.contactDetails?.phone ? 'border-red-500' : ''}
                />
                {errors.contactDetails?.phone && (
                  <p className="text-red-500 text-sm">
                    {errors.contactDetails.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Booking confirmation and ticket details will be sent to this email address and phone number.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Total tickets: {selectedSeats.length}</span>
                <span>Total amount: ₹{getTotalPrice()}</span>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!isValid || loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    Confirm Booking - ₹{getTotalPrice()}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
