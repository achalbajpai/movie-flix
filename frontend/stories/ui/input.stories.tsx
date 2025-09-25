import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Search, Mail, Eye, EyeOff, Calendar, User } from 'lucide-react';
import { useState } from 'react';

const meta = {
  title: 'Components/UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A form input component for collecting user data. Supports various input types and can be combined with labels and validation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'tel', 'url', 'search', 'date', 'time', 'datetime-local', 'file'],
      description: 'The type of input field',
      table: {
        defaultValue: { summary: 'text' },
        type: { summary: 'string' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when the input is empty',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the input is read-only',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the input is required',
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the input',
    },
  },
  args: {
    type: 'text',
    placeholder: 'Enter text...',
  },
} satisfies Meta<typeof Input>

export default meta;
type Story = StoryObj<typeof meta>;

// Basic playground story
export const Playground: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

// Input types
export const Types: Story = {
  render: () => (
    <div className="space-y-3 w-80">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="search" placeholder="Search input" />
      <Input type="date" />
    </div>
  ),
};

// Input states
export const States: Story = {
  render: () => (
    <div className="space-y-3 w-80">
      <Input placeholder="Default state" />
      <Input placeholder="Disabled state" disabled />
      <Input value="Read-only state" readOnly />
      <Input placeholder="Invalid state" aria-invalid="true" />
    </div>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-3 w-80">
      <div className="relative">
        <Input placeholder="Search..." className="pl-10" />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      <div className="relative">
        <Input type="email" placeholder="Email" className="pl-10" />
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      <div className="relative">
        <Input placeholder="Name" className="pl-10" />
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  ),
};