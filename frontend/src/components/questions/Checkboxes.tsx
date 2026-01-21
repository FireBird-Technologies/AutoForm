import React, { useCallback, useRef, useEffect } from 'react';
import { QuestionProps } from './ShortAnswer';

export const Checkboxes: React.FC<QuestionProps> = ({
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
  
  // Use ref to always have the latest choices value, preventing race conditions
  const choicesRef = useRef<string[]>(value?.choices || []);
  
  // Keep ref in sync with props
  useEffect(() => {
    choicesRef.current = value?.choices || [];
  }, [value?.choices]);
  
  // Display value from props for rendering
  const selectedChoices = value?.choices || [];

  const handleToggle = useCallback((choice: string) => {
    // Use ref to get the absolute latest state, even if React hasn't re-rendered yet
    const currentChoices = [...choicesRef.current];
    const newChoices = currentChoices.includes(choice)
      ? currentChoices.filter((c: string) => c !== choice)
      : [...currentChoices, choice];
    
    // Update ref immediately for next rapid click
    choicesRef.current = newChoices;
    
    onChange({ choices: newChoices });
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {choices.map((choice: string, index: number) => (
          <label 
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              background: selectedChoices.includes(choice) ? `${effectiveAccent}10` : 'transparent'
            }}
            onMouseEnter={(e) => !disabled && (e.currentTarget.style.borderColor = effectiveAccent)}
            onMouseLeave={(e) => !disabled && (e.currentTarget.style.borderColor = '#e5e7eb')}
          >
            <input
              type="checkbox"
              checked={selectedChoices.includes(choice)}
              onChange={() => handleToggle(choice)}
              disabled={disabled}
              style={{
                width: '18px',
                height: '18px',
                accentColor: effectiveAccent,
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
            />
            <span style={{
              fontSize: '15px',
              color: '#000000',
              flex: 1
            }}>
              {choice}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

