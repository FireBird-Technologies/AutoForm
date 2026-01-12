import React from 'react';
import { QuestionProps } from './ShortAnswer';

// Helper to normalize int or list to array of strings
const normalizeToArray = (val: number | string[] | undefined, prefix: string): string[] => {
  if (!val) return [];
  if (typeof val === 'number') {
    return Array.from({ length: Math.max(1, val) }, (_, i) => `${prefix} ${i + 1}`);
  }
  return val;
};

export const Matrix: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const matrixAnswers = value?.matrix_answers || {};
  const rows = normalizeToArray(question.settings?.rows, 'Row');
  const columns = normalizeToArray(question.settings?.columns, 'Column');

  const handleChange = (row: string, column: string) => {
    onChange({
      matrix_answers: {
        ...matrixAnswers,
        [row]: column
      }
    });
  };

  return (
    <div style={{
      marginBottom: '48px',
      transition: 'all 0.2s'
    }}>
      <label style={{
        display: 'block',
        fontSize: '16px',
        fontWeight: '500',
        color: '#000000',
        marginBottom: '8px',
        letterSpacing: '-0.01em'
      }}>
        {question.question_text}
        {question.required && <span style={{ color: '#9333ea', marginLeft: '4px' }}>*</span>}
      </label>
      {question.description && (
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '12px',
          lineHeight: '1.5'
        }}>
          {question.description}
        </p>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '0'
        }}>
          <thead>
            <tr>
              <th style={{
                padding: '12px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                textAlign: 'left',
                borderBottom: '1px solid #e5e7eb'
              }}></th>
              {columns.map((col: string, index: number) => (
                <th key={index} style={{
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  textAlign: 'center',
                  borderBottom: '1px solid #e5e7eb'
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: string, rowIndex: number) => (
              <tr key={rowIndex}>
                <td style={{
                  padding: '12px',
                  fontSize: '15px',
                  color: '#000000',
                  borderBottom: '1px solid #f3f4f6'
                }}>{row}</td>
                {columns.map((col: string, colIndex: number) => (
                  <td key={colIndex} style={{
                    padding: '12px',
                    textAlign: 'center',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <input
                      type="radio"
                      name={`matrix-${question.id}-${rowIndex}`}
                      checked={matrixAnswers[row] === col}
                      onChange={() => handleChange(row, col)}
                      disabled={disabled}
                      required={question.required}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#9333ea',
                        cursor: disabled ? 'not-allowed' : 'pointer'
                      }}
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

