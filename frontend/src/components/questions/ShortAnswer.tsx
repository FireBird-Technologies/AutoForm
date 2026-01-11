import React from 'react';

export interface QuestionProps {
  question: {
    id: number;
    question_text: string;
    description?: string;
    required: boolean;
    settings?: any;
  };
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export const ShortAnswer: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const textValue = value?.text || '';
  const placeholder = question.settings?.placeholder || 'Your answer';
  const maxLength = question.settings?.max_length;

  return (
    <div style={{
      marginBottom: '48px',
      transition: 'all 0.2s'
    }}>
      <label style={{
        display: 'block',
        fontSize: '16px',
        fontWeight: '500',
        color: '#000000',
        marginBottom: '8px',
        letterSpacing: '-0.01em'
      }}>
        {question.question_text}
        {question.required && <span style={{ color: '#9333ea', marginLeft: '4px' }}>*</span>}
      </label>
      {question.description && (
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '12px',
          lineHeight: '1.5'
        }}>
          {question.description}
        </p>
      )}
      <input
        type="text"
        value={textValue}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        required={question.required}
        style={{
          width: '100%',
          padding: '12px 0',
          fontSize: '15px',
          border: 'none',
          borderBottom: '1px solid #e5e7eb',
          outline: 'none',
          background: 'transparent',
          transition: 'border-color 0.2s',
          fontFamily: 'inherit'
        }}
        onFocus={(e) => e.currentTarget.style.borderBottomColor = '#9333ea'}
        onBlur={(e) => e.currentTarget.style.borderBottomColor = '#e5e7eb'}
      />
      {maxLength && (
        <div style={{
          fontSize: '12px',
          color: '#9ca3af',
          marginTop: '6px'
        }}>
          {textValue.length} / {maxLength}
        </div>
      )}
    </div>
  );
};

