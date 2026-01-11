import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const Rating: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const ratingValue = value?.rating || 0;
  const maxRating = question.settings?.max_value || 5;

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
      <div style={{ display: 'flex', gap: '8px' }}>
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= ratingValue;
          return (
            <button
              key={index}
              type="button"
              onClick={() => !disabled && onChange({ rating: starValue })}
              disabled={disabled}
              style={{
                fontSize: '32px',
                color: isFilled ? '#9333ea' : '#e5e7eb',
                background: 'transparent',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                padding: '4px',
                transition: 'all 0.2s',
                lineHeight: 1
              }}
              onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1)')}
            >
              ★
            </button>
          );
        })}
      </div>
      {ratingValue > 0 && (
        <div style={{
          fontSize: '13px',
          color: '#6b7280',
          marginTop: '8px'
        }}>
          {ratingValue} out of {maxRating} stars
        </div>
      )}
    </div>
  );
};

