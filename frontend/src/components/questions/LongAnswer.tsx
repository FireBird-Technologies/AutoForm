import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const LongAnswer: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  hideLabel = false,
  accentColor = '#9333ea',
  boldTextColor
}) => {
  const effectiveAccent = boldTextColor || accentColor;
  const textValue = value?.text || '';
  const placeholder = question.settings?.placeholder || 'Your answer';
  const maxLength = question.settings?.max_length;

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
            {question.required && <span style={{ color: effectiveAccent, marginLeft: '4px' }}>*</span>}
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
      <textarea
        value={textValue}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        required={question.required}
        rows={4}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '15px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          outline: 'none',
          background: 'transparent',
          transition: 'border-color 0.2s',
          fontFamily: 'inherit',
          resize: 'vertical'
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = effectiveAccent}
        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
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

