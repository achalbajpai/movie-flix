import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '../../components/ui/badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Badge',
  },
}

export const AC: Story = {
  args: {
    children: 'AC',
    variant: 'secondary',
  },
}

export const NonAC: Story = {
  args: {
    children: 'Non-AC',
    variant: 'outline',
  },
}

export const Sleeper: Story = {
  args: {
    children: 'Sleeper',
    variant: 'default',
  },
}

export const Available: Story = {
  args: {
    children: 'Available',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
}

export const SoldOut: Story = {
  args: {
    children: 'Sold Out',
    variant: 'destructive',
  },
}

export const TimeSlots: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">Morning (6AM - 12PM)</Badge>
      <Badge variant="outline">Afternoon (12PM - 6PM)</Badge>
      <Badge variant="outline">Evening (6PM - 12AM)</Badge>
      <Badge variant="outline">Night (12AM - 6AM)</Badge>
    </div>
  ),
}

export const BusTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">AC</Badge>
      <Badge variant="secondary">Non-AC</Badge>
      <Badge variant="secondary">Sleeper</Badge>
      <Badge variant="secondary">Semi-Sleeper</Badge>
      <Badge variant="secondary">Seater</Badge>
    </div>
  ),
}

export const Operators: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">RedBus</Badge>
      <Badge variant="outline">Volvo</Badge>
      <Badge variant="outline">Patel Tours</Badge>
      <Badge variant="outline">SRS Travels</Badge>
    </div>
  ),
}

export const StatusBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium">Availability Status</h4>
        <div className="flex gap-2">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Available</Badge>
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Few Left</Badge>
          <Badge variant="destructive">Sold Out</Badge>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Bus Features</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">AC</Badge>
          <Badge variant="secondary">WiFi</Badge>
          <Badge variant="secondary">Charging Point</Badge>
          <Badge variant="secondary">Water Bottle</Badge>
          <Badge variant="secondary">Blanket</Badge>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Ratings</h4>
        <div className="flex gap-2">
          <Badge className="bg-green-600 hover:bg-green-600">⭐ 4.5+</Badge>
          <Badge className="bg-blue-600 hover:bg-blue-600">⭐ 4.0+</Badge>
          <Badge className="bg-orange-600 hover:bg-orange-600">⭐ 3.5+</Badge>
        </div>
      </div>
    </div>
  ),
}

export const PriceTags: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 items-center">
      <Badge variant="outline">₹500 - ₹1000</Badge>
      <Badge variant="outline">₹1000 - ₹1500</Badge>
      <Badge variant="outline">₹1500 - ₹2000</Badge>
      <Badge variant="outline">₹2000+</Badge>
    </div>
  ),
}