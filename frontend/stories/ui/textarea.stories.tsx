import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';

const meta = {
  title: 'Components/UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A multi-line text input control, ideal for longer messages or comments.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when the textarea is empty',
    },
    disabled: {
      control: 'boolean',
      description: 'When true, prevents the user from interacting with the textarea',
    },
    rows: {
      control: 'number',
      description: 'Number of visible text lines',
    },
  },
} satisfies Meta<typeof Textarea>

export default meta;
type Story = StoryObj<typeof meta>;

// Playground
export const Playground: Story = {
  args: {
    placeholder: 'Enter your message...',
  },
  render: (args) => (
    <div className="w-[400px]">
      <Label htmlFor="textarea">Message</Label>
      <Textarea id="textarea" {...args} />
    </div>
  ),
};

// States
export const States: Story = {
  render: () => (
    <div className="grid gap-4 w-[400px]">
      <div>
        <Label htmlFor="default">Default</Label>
        <Textarea id="default" placeholder="Enter your message..." />
      </div>

      <div>
        <Label htmlFor="with-value">With Value</Label>
        <Textarea 
          id="with-value" 
          defaultValue="This textarea has some default content that shows how text wraps and displays in the component."
        />
      </div>

      <div>
        <Label htmlFor="disabled">Disabled</Label>
        <Textarea 
          id="disabled" 
          placeholder="This textarea is disabled" 
          disabled 
        />
      </div>
    </div>
  ),
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="grid gap-4 w-[400px]">
      <div>
        <Label htmlFor="small">Small (3 rows)</Label>
        <Textarea 
          id="small" 
          placeholder="Small textarea..." 
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="medium">Medium (5 rows)</Label>
        <Textarea 
          id="medium" 
          placeholder="Medium textarea..." 
          rows={5}
        />
      </div>

      <div>
        <Label htmlFor="large">Large (8 rows)</Label>
        <Textarea 
          id="large" 
          placeholder="Large textarea for longer content..." 
          rows={8}
        />
      </div>
    </div>
  ),
};