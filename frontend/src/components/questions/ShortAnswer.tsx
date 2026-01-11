import React from 'react';

export interface QuestionProps {
  question: {
    id: number;
    question_text: string;
    description?: string;
    required: boolean;
    settings?: any;
  };
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export const ShortAnswer: React.FC<QuestionProps> = ({
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
      <input
        type="text"
        className="question-input"
        value={textValue}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        required={question.required}
      />
      {maxLength && (
        <div className="character-count">
          {textValue.length} / {maxLength}
        </div>
      )}
    </div>
  );
};

