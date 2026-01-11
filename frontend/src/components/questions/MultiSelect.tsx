import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const MultiSelect: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const selectedChoices = value?.choices || [];
  const choices = question.settings?.choices || [];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions);
    const values = options.map(option => option.value);
    onChange({ choices: values });
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
      <select
        className="question-select"
        multiple
        value={selectedChoices}
        onChange={handleChange}
        disabled={disabled}
        required={question.required}
        size={Math.min(choices.length, 5)}
      >
        {choices.map((choice: string, index: number) => (
          <option key={index} value={choice}>
            {choice}
          </option>
        ))}
      </select>
      <div className="input-hint">Hold Ctrl/Cmd to select multiple options</div>
    </div>
  );
};

