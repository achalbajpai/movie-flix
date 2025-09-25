import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from '../../components/ui/button'
import { Search, ArrowRight, Loader2, Mail, Plus } from 'lucide-react'

const meta = {
  title: 'Components/UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a button or a component that looks like a button. A versatile component for user interaction with multiple variants, sizes, and states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Defines the visual style of the button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Controls the size of the button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'When true, prevents interaction and shows disabled state',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    children: {
      description: 'The content of the button',
      table: {
        type: { summary: 'React.ReactNode' },
      },
    },
    onClick: {
      description: 'Function called when the button is clicked',
      table: {
        type: { summary: '() => void' },
      },
    },
    asChild: {
      control: 'boolean',
      description: 'Change the default rendered element for the one passed as a child',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
  args: {
    children: 'Button',
    disabled: false,
    asChild: false,
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Basic playground story
export const Playground: Story = {
  args: {
    children: 'Button',
  },
};

// All variants
export const Variants: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap items-center">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ),
};

// Disabled state
export const Disabled: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Button disabled>Disabled</Button>
      <Button variant="outline" disabled>Disabled Outline</Button>
      <Button variant="secondary" disabled>Disabled Secondary</Button>
    </div>
  ),
};