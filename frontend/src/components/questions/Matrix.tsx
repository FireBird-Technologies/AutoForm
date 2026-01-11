import React from 'react';
import { QuestionProps } from './ShortAnswer';

export const Matrix: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const matrixAnswers = value?.matrix_answers || {};
  const rows = question.settings?.rows || [];
  const columns = question.settings?.columns || [];

  const handleChange = (row: string, column: string) => {
    onChange({
      matrix_answers: {
        ...matrixAnswers,
        [row]: column
      }
    });
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
      <div className="matrix-container">
        <table className="matrix-table">
          <thead>
            <tr>
              <th></th>
              {columns.map((col: string, index: number) => (
                <th key={index}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: string, rowIndex: number) => (
              <tr key={rowIndex}>
                <td className="matrix-row-label">{row}</td>
                {columns.map((col: string, colIndex: number) => (
                  <td key={colIndex}>
                    <input
                      type="radio"
                      name={`matrix-${question.id}-${rowIndex}`}
                      checked={matrixAnswers[row] === col}
                      onChange={() => handleChange(row, col)}
                      disabled={disabled}
                      required={question.required}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

