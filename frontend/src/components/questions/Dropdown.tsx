import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const Dropdown: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const selectedChoice = value?.text || '';
  const choices = question.settings?.choices || [];

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
      <select
        value={selectedChoice}
        onChange={(e) => onChange({ text: e.target.value })}
        disabled={disabled}
        required={question.required}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '15px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          outline: 'none',
          background: '#ffffff',
          transition: 'border-color 0.2s',
          fontFamily: 'inherit',
          cursor: 'pointer'
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = '#9333ea'}
        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
      >
        <option value="">Select an option</option>
        {choices.map((choice: string, index: number) => (
          <option key={index} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    </div>
  );
};

