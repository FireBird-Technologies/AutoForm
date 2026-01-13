import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const LinearScale: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  hideLabel = false,
  accentColor = '#9333ea',
  boldTextColor
}) => {
  const effectiveAccent = boldTextColor || accentColor;
  const scaleValue = value?.number || 0;
  const minValue = question.settings?.min_value || 1;
  const maxValue = question.settings?.max_value || 10;
  const minLabel = question.settings?.scale_min_label || '';
  const maxLabel = question.settings?.scale_max_label || '';
  const range = maxValue - minValue + 1;
  const useSlider = range > 10;

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
        
        {useSlider ? (
          // Slider for ranges > 10
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#6b7280',
                minWidth: '40px'
              }}>
                {minValue}
              </span>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="range"
                  min={minValue}
                  max={maxValue}
                  value={scaleValue || minValue}
                  onChange={(e) => onChange({ number: parseInt(e.target.value) })}
                  disabled={disabled}
                  required={question.required}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: `linear-gradient(to right, ${effectiveAccent} 0%, ${effectiveAccent} ${((scaleValue - minValue) / (maxValue - minValue)) * 100}%, #e5e7eb ${((scaleValue - minValue) / (maxValue - minValue)) * 100}%, #e5e7eb 100%)`,
                    outline: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    accentColor: effectiveAccent,
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
                <style>
                  {`
                    input[type="range"]::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: ${effectiveAccent};
                      cursor: pointer;
                      border: 3px solid #ffffff;
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    }
                    
                    input[type="range"]::-moz-range-thumb {
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: ${effectiveAccent};
                      cursor: pointer;
                      border: 3px solid #ffffff;
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    }
                    
                    input[type="range"]::-webkit-slider-runnable-track {
                      height: 6px;
                      border-radius: 3px;
                    }
                    
                    input[type="range"]::-moz-range-track {
                      height: 6px;
                      border-radius: 3px;
                    }
                  `}
                </style>
              </div>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#6b7280',
                minWidth: '40px',
                textAlign: 'right'
              }}>
                {maxValue}
              </span>
            </div>
            {scaleValue > 0 && (
              <div style={{
                marginTop: '12px',
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: '600',
                color: effectiveAccent
              }}>
                Selected: {scaleValue}
              </div>
            )}
          </div>
        ) : (
          // Buttons for ranges <= 10
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'space-between'
          }}>
            {[...Array(range)].map((_, index) => {
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
                    background: isSelected ? effectiveAccent : 'transparent',
                    border: `1px solid ${isSelected ? effectiveAccent : '#e5e7eb'}`,
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                  }}>
                    {optionValue}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

