import React, { Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
}

const DEFAULT_PRESET_COLORS = [
  '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db',
  '#1f2937', '#374151', '#4b5563', '#6b7280',
  '#9333ea', '#7c3aed', '#a855f7', '#c084fc',
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  presetColors = DEFAULT_PRESET_COLORS
}) => {
  const colorInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px'
        }}
      >
        {label}
      </label>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
        {/* Color Block that opens native picker */}
        <button
          type="button"
          onClick={() => colorInputRef.current?.click()}
          style={{
            width: '48px',
            height: '40px',
            borderRadius: '6px',
            border: '2px solid #e5e7eb',
            cursor: 'pointer',
            padding: '0',
            background: value,
            position: 'relative',
            overflow: 'hidden'
          }}
          title="Pick a custom color"
        >
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(45deg, #ccc 25%, transparent 25%), 
                        linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #ccc 75%), 
                        linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
            zIndex: -1
          }} />
        </button>
        <input
          ref={colorInputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            width: '1px',
            height: '1px'
          }}
        />

        {/* Hex Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          style={{
            flex: 1,
            padding: '10px 12px',
            fontSize: '14px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            outline: 'none',
            fontFamily: 'ui-monospace, monospace',
            textTransform: 'uppercase'
          }}
        />
      </div>

      {/* Preset Colors */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '8px'
        }}
      >
        {presetColors.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              background: color,
              border: value === color ? '2px solid #9333ea' : '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'transform 0.1s',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
};

interface GlobalColorPickerProps {
  colors: {
    background: string;
    text: string;
    accent: string;
  };
  onChange: (colors: { background: string; text: string; accent: string }) => void;
}

export const GlobalColorPicker: React.FC<GlobalColorPickerProps> = ({ colors, onChange }) => {
  return (
    <Popover className="relative">
      {() => (
        <>
          <Popover.Button
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#6b7280',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              outline: 'none'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0 0 0 20 4 4 0 0 1 0-8 4 4 0 0 0 0-8" />
            </svg>
            Colors
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel
              style={{
                position: 'absolute',
                right: 0,
                marginTop: '8px',
                width: '320px',
                background: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                zIndex: 50
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '16px'
                }}
              >
                Form Colors
              </h3>

              <ColorPicker
                label="Background"
                value={colors.background}
                onChange={(background) => onChange({ ...colors, background })}
              />

              <ColorPicker
                label="Text Color (Normal)"
                value={colors.text}
                onChange={(text) => onChange({ ...colors, text })}
              />

              <ColorPicker
                label="Text Color (Bold/Special)"
                value={colors.boldText || '#9333ea'}
                onChange={(boldText) => onChange({ ...colors, boldText })}
              />

              <ColorPicker
                label="Accent"
                value={colors.accent}
                onChange={(accent) => onChange({ ...colors, accent })}
              />
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

interface QuestionColorPickerProps {
  questionId: number;
  colors: {
    background?: string;
    color?: string;
    border?: string;
  };
  onChange: (questionId: number, colors: { background?: string; color?: string; border?: string }) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const QuestionColorPicker: React.FC<QuestionColorPickerProps> = ({
  questionId,
  colors,
  onChange,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '20px'
          }}
        >
          Question Colors
        </h3>

        <ColorPicker
          label="Background"
          value={colors.background || '#ffffff'}
          onChange={(background) => onChange(questionId, { ...colors, background })}
        />

        <ColorPicker
          label="Text Color"
          value={colors.color || '#1f2937'}
          onChange={(color) => onChange(questionId, { ...colors, color })}
        />

        <ColorPicker
          label="Border Color"
          value={colors.border || '#e5e7eb'}
          onChange={(border) => onChange(questionId, { ...colors, border })}
        />

        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '10px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#ffffff',
            background: '#9333ea',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
};
