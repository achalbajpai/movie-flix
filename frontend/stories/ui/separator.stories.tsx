import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Separator } from '../../components/ui/separator';

const meta = {
  title: 'Components/UI/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Visually or semantically separates content.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the separator',
      table: {
        defaultValue: { summary: 'horizontal' },
      },
    },
    decorative: {
      control: 'boolean',
      description: 'When true, signifies that it is purely visual, carries no semantic meaning',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
  },
} satisfies Meta<typeof Separator>

export default meta;
type Story = StoryObj<typeof meta>;

// Playground
export const Playground: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: (args) => (
    <div className="w-64">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Section Title</h4>
        <p className="text-sm text-muted-foreground">Section description</p>
      </div>
      <Separator {...args} className="my-4" />
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Next Section</h4>
        <p className="text-sm text-muted-foreground">More content here</p>
      </div>
    </div>
  ),
};

// Orientations
export const Orientations: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Horizontal */}
      <div className="w-64">
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Horizontal</h4>
          <p className="text-sm text-muted-foreground">Default orientation</p>
        </div>
        <Separator className="my-4" />
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Content Below</h4>
          <p className="text-sm text-muted-foreground">Separated content</p>
        </div>
      </div>

      {/* Vertical */}
      <div className="flex h-16 items-center space-x-4">
        <div className="text-sm">Left</div>
        <Separator orientation="vertical" />
        <div className="text-sm">Middle</div>
        <Separator orientation="vertical" />
        <div className="text-sm">Right</div>
      </div>
    </div>
  ),
};

// In Navigation
export const InNavigation: Story = {
  render: () => (
    <div className="space-y-6">
      {/* Breadcrumb style */}
      <div className="flex items-center space-x-2 text-sm">
        <span>Home</span>
        <Separator orientation="vertical" className="h-4" />
        <span>Products</span>
        <Separator orientation="vertical" className="h-4" />
        <span>Current</span>
      </div>

      {/* Menu style */}
      <div className="w-48 rounded-md border p-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Account</div>
          <div className="text-sm text-muted-foreground">Profile settings</div>
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <div className="text-sm font-medium">Billing</div>
          <div className="text-sm text-muted-foreground">Payment methods</div>
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <div className="text-sm font-medium">Support</div>
          <div className="text-sm text-muted-foreground">Help & feedback</div>
        </div>
      </div>
    </div>
  ),
};