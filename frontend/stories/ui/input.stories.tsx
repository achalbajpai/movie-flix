import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
import { Search, MapPin, Calendar, User, Mail } from 'lucide-react'

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date'],
    },
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithLabel: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="input-1">Email</Label>
      <Input {...args} id="input-1" placeholder="Enter your email" />
    </div>
  ),
}

export const CitySearch: Story = {
  render: (args) => (
    <div className="w-full max-w-sm space-y-2">
      <Label>Departure City</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input {...args} className="pl-10 h-12" placeholder="Search departure city" />
      </div>
    </div>
  ),
}

export const SearchWithButton: Story = {
  render: (args) => (
    <div className="w-full max-w-sm space-y-2">
      <Label>Search Buses</Label>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input {...args} className="pl-10 pr-20 h-12" placeholder="Search routes..." />
        <Button size="sm" className="absolute right-1 top-1 h-10">
          Search
        </Button>
      </div>
    </div>
  ),
}

export const DateInput: Story = {
  render: (args) => (
    <div className="w-full max-w-sm space-y-2">
      <Label>Departure Date</Label>
      <div className="relative">
        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          {...args}
          type="date"
          className="pl-10 h-12"
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
    </div>
  ),
}

export const NumberInput: Story = {
  render: (args) => (
    <div className="w-full max-w-sm space-y-2">
      <Label>Number of Passengers</Label>
      <Input
        {...args}
        type="number"
        min="1"
        max="10"
        defaultValue="1"
        className="h-12"
      />
    </div>
  ),
}

export const WithError: Story = {
  render: (args) => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="error-input">Email</Label>
      <Input
        {...args}
        id="error-input"
        className="border-destructive focus:ring-destructive h-12"
        placeholder="Enter your email"
      />
      <p className="text-sm text-destructive">Please enter a valid email address.</p>
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
    value: 'Cannot edit this',
    className: 'h-12',
  },
}

export const SearchFormInputs: Story = {
  render: () => (
    <div className="w-full max-w-2xl space-y-4 p-6 border rounded-lg">
      <h3 className="font-medium">Search Form Inputs</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>From</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 h-12" placeholder="Departure city" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>To</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 h-12" placeholder="Destination city" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Departure Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input type="date" className="pl-10 h-12" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Passengers</Label>
          <Input type="number" min="1" max="10" defaultValue="1" className="h-12" />
        </div>
      </div>
    </div>
  ),
}