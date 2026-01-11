import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const NumberInput: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const numberValue = value?.number !== undefined ? value.number : '';
  const minValue = question.settings?.min_value;
  const maxValue = question.settings?.max_value;
  const placeholder = question.settings?.placeholder || 'Enter a number';

  return (
    <div className="question-wrapper">
      <label className="question-label">
        {question.question_text}
        {question.required && <span className="required-mark">*</span>}
      </label>
      {question.description && (
        <p className="question-description">{question.description}</p>
      )}
      <input
        type="number"
        className="question-input"
        value={numberValue}
        onChange={(e) => onChange({ number: e.target.value ? parseFloat(e.target.value) : null })}
        placeholder={placeholder}
        disabled={disabled}
        min={minValue}
        max={maxValue}
        required={question.required}
      />
      {(minValue !== undefined || maxValue !== undefined) && (
        <div className="input-hint">
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

