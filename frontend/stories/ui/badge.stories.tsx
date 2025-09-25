import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from '../../components/ui/badge';
import { Check, X, Star, Bell, AlertCircle } from 'lucide-react';

const meta = {
  title: 'Components/UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A small label or tag used to display status, categories, or metadata. Badges are compact and help organize and highlight information.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'The variant of the badge that determines its visual style',
      table: {
        defaultValue: { summary: 'default' },
        type: { summary: 'default | secondary | destructive | outline' },
      },
    },
    asChild: {
      control: 'boolean',
      description: 'Change the default rendered element for the badge',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    children: {
      control: 'text',
      description: 'The content of the badge',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the badge',
    },
  },
  args: {
    variant: 'default',
    children: 'Badge',
    asChild: false,
  },
} satisfies Meta<typeof Badge>

export default meta;
type Story = StoryObj<typeof meta>;

// Basic playground story
export const Playground: Story = {
  args: {
    variant: 'default',
    children: 'Badge',
  },
};

// All variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Badge variant="default" className="gap-1">
        <Check className="h-3 w-3" />
        Completed
      </Badge>
      <Badge variant="secondary" className="gap-1">
        <Star className="h-3 w-3" />
        Featured
      </Badge>
      <Badge variant="destructive" className="gap-1">
        <X className="h-3 w-3" />
        Error
      </Badge>
      <Badge variant="outline" className="gap-1">
        <Bell className="h-3 w-3" />
        Notification
      </Badge>
    </div>
  ),
};

