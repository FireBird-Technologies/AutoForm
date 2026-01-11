import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const MultipleChoice: React.FC<QuestionProps> = ({
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
      <div className="choices-container">
        {choices.map((choice: string, index: number) => (
          <label key={index} className="choice-label">
            <input
              type="radio"
              name={`question-${question.id}`}
              value={choice}
              checked={selectedChoice === choice}
              onChange={(e) => onChange({ text: e.target.value })}
              disabled={disabled}
              required={question.required}
            />
            <span className="choice-text">{choice}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

