# Business Configuration Guide

This document describes all configurable business rules and policies in the bus booking system.

## Overview

Business configuration is centralized in [`src/config/business.ts`](src/config/business.ts) and can be overridden via environment variables without code deployment.

## Configuration Options

### Seat Reservation Settings

#### `SEAT_RESERVATION_TIMEOUT_MINUTES`
- **Type**: Number
- **Default**: `5` (minutes)
- **Description**: Duration that seat reservations are held before automatic release
- **Example**: `SEAT_RESERVATION_TIMEOUT_MINUTES=10`
- **Usage**: When a user selects seats, they are temporarily reserved. If booking is not completed within this time, seats are released.

### Pagination Settings

#### `DEFAULT_PAGE_SIZE`
- **Type**: Number
- **Default**: `10`
- **Description**: Default number of items returned per page in paginated endpoints
- **Example**: `DEFAULT_PAGE_SIZE=20`

#### `MAX_PAGE_SIZE`
- **Type**: Number
- **Default**: `100`
- **Description**: Maximum allowed page size to prevent performance issues
- **Example**: `MAX_PAGE_SIZE=50`
- **Validation**: Requests exceeding this limit will be capped at max value

### Refund Policy Settings

#### `REFUND_POLICY_HOURS`
- **Type**: Number
- **Default**: `2` (hours)
- **Description**: Minimum hours before show time when cancellation is allowed
- **Example**: `REFUND_POLICY_HOURS=4`
- **Business Rule**: Bookings cannot be cancelled within this window before show time

#### Refund Percentage Policy

The refund percentage is based on how far in advance the booking is cancelled:

| Hours Before Show | Refund Percentage |
|-------------------|-------------------|
| 24+ hours         | 100%              |
| 12-24 hours       | 75%               |
| 2-12 hours        | 50%               |
| < 2 hours         | 0% (No refund)    |

**Note**: The time thresholds in the refund percentage map are currently hard-coded in [`business.ts`](src/config/business.ts) but can be made configurable if needed.

### Booking Limits

#### `MAX_SEATS_PER_BOOKING`
- **Type**: Number
- **Default**: `10`
- **Description**: Maximum number of seats that can be booked in a single transaction
- **Example**: `MAX_SEATS_PER_BOOKING=15`
- **Business Rule**: Prevents bulk booking abuse

#### `MIN_ADVANCE_BOOKING_MINUTES`
- **Type**: Number
- **Default**: `15` (minutes)
- **Description**: Minimum time before show starts that bookings can be made
- **Example**: `MIN_ADVANCE_BOOKING_MINUTES=30`
- **Business Rule**: Ensures customers have time to reach the theater

## Configuration in Code

### Accessing Configuration

```typescript
import { businessConfig } from '@/config'

// Access configuration values
const timeout = businessConfig.seatReservationTimeoutMs
const maxSeats = businessConfig.maxSeatsPerBooking
```

### Helper Functions

The business config module provides helper functions for common operations:

#### `canCancelBooking(showTime: Date, currentTime?: Date): boolean`
Determines if a booking can be cancelled based on show time and refund policy.

```typescript
import { canCancelBooking } from '@/config'

const showTime = new Date('2025-10-15T18:00:00')
const canCancel = canCancelBooking(showTime) // true if > 2 hours before show
```

#### `calculateRefundAmount(totalAmount: number, showTime: Date, currentTime?: Date): number`
Calculates refund amount based on cancellation time and refund policy.

```typescript
import { calculateRefundAmount } from '@/config'

const showTime = new Date('2025-10-15T18:00:00')
const refund = calculateRefundAmount(1000, showTime) // Returns amount based on policy
```

#### `calculateRefundPercentage(hoursBeforeShow: number): number`
Returns the refund percentage for a given time before show.

```typescript
import { calculateRefundPercentage } from '@/config'

const percentage = calculateRefundPercentage(25) // Returns 100 (full refund)
```

#### `calculateSeatReservationExpiry(fromTime?: Date): Date`
Calculates expiry time for seat reservations.

```typescript
import { calculateSeatReservationExpiry } from '@/config'

const expiryTime = calculateSeatReservationExpiry() // Returns Date 5 minutes from now
```

## Environment Variable Setup

### Development (.env.local)

```env
# Seat Reservation (5 minutes default)
SEAT_RESERVATION_TIMEOUT_MINUTES=5

# Pagination
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100

# Refund Policy (2 hours minimum cancellation window)
REFUND_POLICY_HOURS=2

# Booking Limits
MAX_SEATS_PER_BOOKING=10
MIN_ADVANCE_BOOKING_MINUTES=15
```

### Production (.env.production)

For production, you may want more restrictive or business-specific values:

```env
# Shorter reservation timeout to prevent seat hogging
SEAT_RESERVATION_TIMEOUT_MINUTES=3

# Larger pagination for admin dashboards
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=200

# Stricter cancellation policy
REFUND_POLICY_HOURS=4

# Prevent bulk booking abuse
MAX_SEATS_PER_BOOKING=8
MIN_ADVANCE_BOOKING_MINUTES=30
```

## Validation

All business configuration values are validated at application startup:

1. **Environment Schema Validation** ([`environment.ts`](src/config/environment.ts))
   - Ensures environment variables are valid numbers when provided
   - Provides sensible defaults if not specified

2. **Business Config Loading** ([`business.ts`](src/config/business.ts))
   - Transforms environment variables into typed configuration
   - Calculates derived values (e.g., milliseconds from minutes)

If configuration is invalid, the application will fail to start with a clear error message.

## Best Practices

### When to Use Environment Variables

Use environment variables to configure values that:
- Differ between environments (dev/staging/prod)
- Change based on business requirements
- May need adjustment without code deployment
- Are deployment-specific (e.g., rate limits, timeouts)

### When to Hard-Code Values

Keep values in code when they:
- Are fundamental to application logic
- Should not vary between environments
- Require code review before changing
- Have complex interdependencies

### Testing Configuration

When testing business logic, you can mock the configuration:

```typescript
import * as config from '@/config/business'

jest.spyOn(config, 'businessConfig', 'get').mockReturnValue({
  refundPolicyHours: 1,
  // ... other config values
})
```

## Impact Analysis

### Changing Seat Reservation Timeout
- **Shorter timeout**: Reduces seat hogging, but may frustrate slow users
- **Longer timeout**: Better user experience, but reduces seat availability

### Changing Refund Policy Hours
- **Shorter window**: More flexible cancellations, higher operational cost
- **Longer window**: Reduces last-minute cancellations, better planning

### Changing Max Seats Per Booking
- **Lower limit**: Prevents abuse, may frustrate large groups
- **Higher limit**: Better for groups, increases risk of bulk buying

## Monitoring

Monitor these metrics to tune configuration:

1. **Seat Reservation Expiry Rate**: % of reservations that expire vs. complete
2. **Cancellation Timing**: When users typically cancel bookings
3. **Booking Size Distribution**: How many seats users typically book
4. **Last-Minute Bookings**: % of bookings made close to show time

## Future Enhancements

Potential additions to business configuration:

- [ ] Dynamic pricing based on demand
- [ ] Configurable refund percentage map via JSON environment variable
- [ ] Theater-specific or show-specific configuration overrides
- [ ] Time-based configuration (e.g., peak vs. off-peak rules)
- [ ] Customer tier-based policies (VIP customers get longer reservation times)

## See Also

- [Environment Configuration](src/config/environment.ts)
- [Business Logic](src/config/business.ts)
- [Validation Helpers](src/utils/ValidationHelpers.ts)
