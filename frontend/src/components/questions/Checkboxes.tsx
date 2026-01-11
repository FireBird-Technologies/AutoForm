import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const Checkboxes: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const selectedChoices = value?.choices || [];
  const choices = question.settings?.choices || [];

  const handleToggle = (choice: string) => {
    const newChoices = selectedChoices.includes(choice)
      ? selectedChoices.filter((c: string) => c !== choice)
      : [...selectedChoices, choice];
    onChange({ choices: newChoices });
  };

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
              type="checkbox"
              checked={selectedChoices.includes(choice)}
              onChange={() => handleToggle(choice)}
              disabled={disabled}
            />
            <span className="choice-text">{choice}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

