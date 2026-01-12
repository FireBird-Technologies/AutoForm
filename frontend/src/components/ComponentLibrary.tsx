import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';

interface ComponentLibraryProps {
  onAdd: (questionType: string) => void;
  disabled?: boolean;
}

const QUESTION_TYPES = [
  { id: 'short_answer', name: 'Short Answer' },
  { id: 'long_answer', name: 'Long Answer' },
  { id: 'multiple_choice', name: 'Multiple Choice' },
  { id: 'checkboxes', name: 'Checkboxes' },
  { id: 'dropdown', name: 'Dropdown' },
  { id: 'multi_select', name: 'Multi-Select' },
  { id: 'number', name: 'Number' },
  { id: 'email', name: 'Email' },
  { id: 'phone', name: 'Phone' },
  { id: 'link', name: 'Link' },
  { id: 'file_upload', name: 'File Upload' },
  { id: 'date', name: 'Date' },
  { id: 'time', name: 'Time' },
  { id: 'linear_scale', name: 'Linear Scale' },
  { id: 'matrix', name: 'Matrix' },
  { id: 'rating', name: 'Rating' },
  { id: 'payment', name: 'Payment' },
  { id: 'signature', name: 'Signature' },
  { id: 'ranking', name: 'Ranking' },
  { id: 'wallet_connect', name: 'Wallet Connect' },
  { id: 'button', name: 'Button' }
];

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onAdd, disabled = false }) => {
  return (
    <div style={{
      background: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap'
      }}>
        Component Library:
      </div>
      
      <Menu as="div" style={{ position: 'relative', display: 'inline-block' }}>
        <Menu.Button
          disabled={disabled}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            color: disabled ? '#9ca3af' : '#374151',
            background: disabled ? '#f3f4f6' : '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s',
            opacity: disabled ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = '#faf5ff';
              e.currentTarget.style.borderColor = '#e9d5ff';
              e.currentTarget.style.color = '#9333ea';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#374151';
            }
          }}
        >
          <span>Add Component</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="ease-out duration-100"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-75"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Menu.Items
            style={{
              position: 'absolute',
              left: 0,
              marginTop: '8px',
              background: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e5e7eb',
              padding: '8px',
              minWidth: '220px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 1000
            }}
          >
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '6px 8px',
              borderBottom: '1px solid #f3f4f6'
            }}>
              Select Component Type
            </div>
            {QUESTION_TYPES.map((type) => (
              <Menu.Item key={type.id}>
                {({ active }) => (
                  <button
                    onClick={() => !disabled && onAdd(type.id)}
                    disabled={disabled}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '14px',
                      color: active ? '#9333ea' : '#374151',
                      background: active ? '#faf5ff' : 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.1s'
                    }}
                  >
                    {type.name}
                  </button>
                )}
              </Menu.Item>
            ))}
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};
