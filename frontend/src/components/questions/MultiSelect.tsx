import React, { useCallback, useRef, useEffect } from 'react';
import { QuestionProps } from './ShortAnswer';

export const MultiSelect: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  hideLabel = false,
  accentColor = '#9333ea',
  boldTextColor
}) => {
  const effectiveAccent = boldTextColor || accentColor;
  const choices = question.settings?.choices || [];
  
  // Use ref to track latest choices, preventing race conditions
  const choicesRef = useRef<string[]>(value?.choices || []);
  
  useEffect(() => {
    choicesRef.current = value?.choices || [];
  }, [value?.choices]);
  
  const selectedChoices = value?.choices || [];

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions);
    const values = options.map(option => option.value);
    choicesRef.current = values;
    onChange({ choices: values });
  }, [onChange]);

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
      <select
        multiple
        value={selectedChoices}
        onChange={handleChange}
        disabled={disabled}
        required={question.required}
        size={Math.min(choices.length, 5)}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '15px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          outline: 'none',
          background: '#ffffff',
          transition: 'border-color 0.2s',
          fontFamily: 'inherit'
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = effectiveAccent}
        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
      >
        {choices.map((choice: string, index: number) => (
          <option key={index} value={choice}>
            {choice}
          </option>
        ))}
      </select>
      <div style={{
        fontSize: '12px',
        color: '#9ca3af',
        marginTop: '6px'
      }}>
        Hold Ctrl/Cmd to select multiple options
      </div>
    </div>
  );
};

