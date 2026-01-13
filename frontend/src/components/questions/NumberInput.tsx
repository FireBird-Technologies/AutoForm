import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const NumberInput: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  hideLabel = false,
  accentColor = '#9333ea',
  boldTextColor
}) => {
  const effectiveAccent = boldTextColor || accentColor;
  const numberValue = value?.number !== undefined ? value.number : '';
  const minValue = question.settings?.min_value;
  const maxValue = question.settings?.max_value;
  const placeholder = question.settings?.placeholder || 'Enter a number';

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
      <input
        type="number"
        value={numberValue}
        onChange={(e) => onChange({ number: e.target.value ? parseFloat(e.target.value) : null })}
        placeholder={placeholder}
        disabled={disabled}
        min={minValue}
        max={maxValue}
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
        onFocus={(e) => e.currentTarget.style.borderBottomColor = effectiveAccent}
        onBlur={(e) => e.currentTarget.style.borderBottomColor = '#e5e7eb'}
      />
      {(minValue !== undefined || maxValue !== undefined) && (
        <div style={{
          fontSize: '12px',
          color: '#9ca3af',
          marginTop: '6px'
        }}>
          {minValue !== undefined && maxValue !== undefined
            ? `Range: ${minValue} - ${maxValue}`
            : minValue !== undefined
            ? `Minimum: ${minValue}`
            : `Maximum: ${maxValue}`}
        </div>
      )}
    </div>
  );
};

