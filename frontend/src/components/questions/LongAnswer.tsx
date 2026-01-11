import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const LongAnswer: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const textValue = value?.text || '';
  const placeholder = question.settings?.placeholder || 'Your answer';
  const maxLength = question.settings?.max_length;

  return (
    <div className="question-wrapper">
      <label className="question-label">
        {question.question_text}
        {question.required && <span className="required-mark">*</span>}
      </label>
      {question.description && (
        <p className="question-description">{question.description}</p>
      )}
      <textarea
        className="question-textarea"
        value={textValue}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        required={question.required}
        rows={4}
      />
      {maxLength && (
        <div className="character-count">
          {textValue.length} / {maxLength}
        </div>
      )}
    </div>
  );
};

