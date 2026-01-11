import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const LinkInput: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const linkValue = value?.text || '';
  const placeholder = question.settings?.placeholder || 'https://example.com';

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
        type="url"
        className="question-input"
        value={linkValue}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={placeholder}
        disabled={disabled}
        required={question.required}
      />
    </div>
  );
};

