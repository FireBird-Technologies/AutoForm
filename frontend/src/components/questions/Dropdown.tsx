import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const Dropdown: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const selectedChoice = value?.text || '';
  const choices = question.settings?.choices || [];

  return (
    <div className="question-wrapper">
      <label className="question-label">
        {question.question_text}
        {question.required && <span className="required-mark">*</span>}
      </label>
      {question.description && (
        <p className="question-description">{question.description}</p>
      )}
      <select
        className="question-select"
        value={selectedChoice}
        onChange={(e) => onChange({ text: e.target.value })}
        disabled={disabled}
        required={question.required}
      >
        <option value="">Select an option</option>
        {choices.map((choice: string, index: number) => (
          <option key={index} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    </div>
  );
};

