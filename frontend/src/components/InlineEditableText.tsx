import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface InlineEditableTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  style?: React.CSSProperties;
  className?: string;
  isTitle?: boolean;
  isDescription?: boolean;
  boldTextColor?: string;
}

export const InlineEditableText: React.FC<InlineEditableTextProps> = ({
  value,
  onChange,
  placeholder = 'Click to edit...',
  multiline = false,
  style = {},
  className = '',
  isTitle = false,
  isDescription = false,
  boldTextColor = '#9333ea'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Select all text
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const baseStyle: React.CSSProperties = {
    cursor: 'text',
    borderRadius: '4px',
    transition: 'background 0.15s',
    minHeight: multiline ? '40px' : 'auto',
    ...style
  };

  const editingStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: isTitle ? '18px' : isDescription ? '14px' : '16px',
    fontWeight: isTitle ? (style.fontWeight || '700') : (style.fontWeight || '400'),
    fontFamily: 'inherit',
    border: '2px solid #9333ea',
    borderRadius: '6px',
    outline: 'none',
    background: '#ffffff',
    color: style.color || '#1f2937',
    resize: multiline ? 'vertical' : 'none',
    minHeight: multiline ? '60px' : 'auto',
    lineHeight: '1.5'
  };

  const displayStyle: React.CSSProperties = {
    ...baseStyle,
    padding: '4px 8px',
    margin: '-4px -8px',
    display: 'block',
    fontWeight: isTitle ? (style.fontWeight || '700') : (style.fontWeight || '400')
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={editingStyle}
          rows={3}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={editingStyle}
      />
    );
  }

  const displayContent = value || placeholder;
  const isEmpty = !value;

  return (
    <div
      className={className}
      onClick={() => setIsEditing(true)}
      style={{
        ...displayStyle,
        color: isEmpty ? '#9ca3af' : (style.color || '#1f2937'),
        fontStyle: isEmpty ? 'italic' : 'normal'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(147, 51, 234, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
      title="Click to edit"
    >
      {isEmpty ? (
        <span>{placeholder}</span>
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <span style={{ margin: 0 }}>{children}</span>,
            strong: ({ children }) => <strong style={{ color: boldTextColor }}>{children}</strong>
          }}
        >
          {displayContent}
        </ReactMarkdown>
      )}
    </div>
  );
};

// Editable option list for multiple choice, checkboxes, etc.
interface EditableOptionsProps {
  options: string[];
  onChange: (options: string[]) => void;
  placeholder?: string;
}

export const EditableOptions: React.FC<EditableOptionsProps> = ({
  options,
  onChange,
  placeholder = 'Option'
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange(newOptions);
  };

  const handleAddOption = () => {
    onChange([...options, `${placeholder} ${options.length + 1}`]);
    setEditingIndex(options.length);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 1) {
      const newOptions = options.filter((_, i) => i !== index);
      onChange(newOptions);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setEditingIndex(null);
    }
    if (e.key === 'Escape') {
      setEditingIndex(null);
    }
    if (e.key === 'Tab' && !e.shiftKey && index === options.length - 1) {
      e.preventDefault();
      handleAddOption();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {options.map((option, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: '2px solid #d1d5db',
              flexShrink: 0
            }}
          />
          {editingIndex === index ? (
            <input
              ref={inputRef}
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              onBlur={() => setEditingIndex(null)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '15px',
                border: '2px solid #9333ea',
                borderRadius: '4px',
                outline: 'none'
              }}
            />
          ) : (
            <div
              onClick={() => setEditingIndex(index)}
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '15px',
                color: option ? '#374151' : '#9ca3af',
                cursor: 'text',
                borderRadius: '4px',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {option || `${placeholder} ${index + 1}`}
            </div>
          )}
          {options.length > 1 && (
            <button
              onClick={() => handleRemoveOption(index)}
              style={{
                width: '24px',
                height: '24px',
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: '#9ca3af',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#dc2626';
                e.currentTarget.style.background = '#fef2f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
                e.currentTarget.style.background = 'transparent';
              }}
              title="Remove option"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <button
        onClick={handleAddOption}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          fontSize: '14px',
          color: '#6b7280',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '4px',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#9333ea';
          e.currentTarget.style.background = 'rgba(147, 51, 234, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#6b7280';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add option
      </button>
    </div>
  );
};
