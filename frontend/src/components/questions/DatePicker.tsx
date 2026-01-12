import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const DatePicker: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  hideLabel = false
}) => {
  const dateValue = value?.date || '';

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
        type="date"
        value={dateValue}
        onChange={(e) => onChange({ date: e.target.value })}
        disabled={disabled}
        required={question.required}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '15px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          outline: 'none',
          background: 'transparent',
          transition: 'border-color 0.2s',
          fontFamily: 'inherit'
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = '#9333ea'}
        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
      />
    </div>
  );
};

