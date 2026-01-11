import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const PhoneInput: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const phoneValue = value?.text || '';
  const placeholder = question.settings?.placeholder || '(123) 456-7890';

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
        type="tel"
        className="question-input"
        value={phoneValue}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={placeholder}
        disabled={disabled}
        required={question.required}
      />
    </div>
  );
};

