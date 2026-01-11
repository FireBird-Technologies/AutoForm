import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const LinearScale: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const scaleValue = value?.number || 0;
  const minValue = question.settings?.min_value || 1;
  const maxValue = question.settings?.max_value || 10;
  const minLabel = question.settings?.scale_min_label || '';
  const maxLabel = question.settings?.scale_max_label || '';

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
      <div>
        {(minLabel || maxLabel) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            {minLabel && (
              <span style={{ fontSize: '13px', color: '#6b7280' }}>{minLabel}</span>
            )}
            {maxLabel && (
              <span style={{ fontSize: '13px', color: '#6b7280' }}>{maxLabel}</span>
            )}
          </div>
        )}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'space-between'
        }}>
          {[...Array(maxValue - minValue + 1)].map((_, index) => {
            const optionValue = minValue + index;
            const isSelected = scaleValue === optionValue;
            return (
              <label 
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: disabled ? 'not-allowed' : 'pointer'
                }}
              >
                <input
                  type="radio"
                  name={`scale-${question.id}`}
                  value={optionValue}
                  checked={isSelected}
                  onChange={(e) => onChange({ number: parseInt(e.target.value) })}
                  disabled={disabled}
                  required={question.required}
                  style={{ display: 'none' }}
                />
                <span style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: isSelected ? '#ffffff' : '#000000',
                  background: isSelected ? '#9333ea' : 'transparent',
                  border: `1px solid ${isSelected ? '#9333ea' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}>
                  {optionValue}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

