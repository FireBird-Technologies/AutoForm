import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const EmailInput: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const emailValue = value?.text || '';
  const placeholder = question.settings?.placeholder || 'email@example.com';

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
        type="email"
        className="question-input"
        value={emailValue}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={placeholder}
        disabled={disabled}
        required={question.required}
      />
    </div>
  );
};

