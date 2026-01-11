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
    <div className="question-wrapper">
      <label className="question-label">
        {question.question_text}
        {question.required && <span className="required-mark">*</span>}
      </label>
      {question.description && (
        <p className="question-description">{question.description}</p>
      )}
      <div className="scale-container">
        <div className="scale-labels">
          {minLabel && <span className="scale-label-min">{minLabel}</span>}
          {maxLabel && <span className="scale-label-max">{maxLabel}</span>}
        </div>
        <div className="scale-options">
          {[...Array(maxValue - minValue + 1)].map((_, index) => {
            const optionValue = minValue + index;
            return (
              <label key={index} className="scale-option">
                <input
                  type="radio"
                  name={`scale-${question.id}`}
                  value={optionValue}
                  checked={scaleValue === optionValue}
                  onChange={(e) => onChange({ number: parseInt(e.target.value) })}
                  disabled={disabled}
                  required={question.required}
                />
                <span className="scale-number">{optionValue}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

