import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const PhoneInput: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  hideLabel = false
}) => {
  const phoneValue = value?.text || '';
  const placeholder = question.settings?.placeholder || '(123) 456-7890';

  return (
    <div style={{
      marginBottom: hideLabel ? '0' : '48px',
      transition: 'all 0.2s'
    }}>
      {!hideLabel && (
        <>
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
        </>
      )}
      <input
        type="tel"
        value={phoneValue}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={placeholder}
        disabled={disabled}
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
    </div>
  );
};

