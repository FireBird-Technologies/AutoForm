import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const DatePicker: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const dateValue = value?.date || '';

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
        type="date"
        className="question-input"
        value={dateValue}
        onChange={(e) => onChange({ date: e.target.value })}
        disabled={disabled}
        required={question.required}
      />
    </div>
  );
};

