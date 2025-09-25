import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

const meta = {
  title: 'Components/UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A callout for user attention. Displays important messages, notifications, or status updates with optional icons and actions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
      description: 'The variant of the alert that determines its appearance',
      table: {
        defaultValue: { summary: 'default' },
        type: { summary: 'default | destructive' },
      },
    },
    children: {
      control: 'text',
      description: 'The content of the alert',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the alert',
    },
  },
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic playground story
export const Playground: Story = {
  args: {
    variant: 'default',
  },
  render: (args: any) => (
    <div className="w-96">
      <Alert {...args}>
        <Info className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          You can add components to your app using the cli.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// All variants
export const Variants: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="default">
        <Info className="h-4 w-4" />
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>
          This is a default alert.
        </AlertDescription>
      </Alert>
      
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Destructive</AlertTitle>
        <AlertDescription>
          This is a destructive alert.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

// With different icons
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Changes saved successfully.</AlertDescription>
      </Alert>
      
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>This action cannot be undone.</AlertDescription>
      </Alert>
      
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    </div>
  ),
};