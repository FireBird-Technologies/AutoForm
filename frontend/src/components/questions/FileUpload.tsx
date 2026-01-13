import React, { useRef } from 'react';
import { QuestionProps } from './ShortAnswer';

export const FileUpload: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  hideLabel = false,
  accentColor = '#9333ea',
  boldTextColor
}) => {
  const effectiveAccent = boldTextColor || accentColor;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileName = value?.text || '';
  const acceptedTypes = question.settings?.file_types?.join(',') || '*';
  const maxSize = question.settings?.max_file_size || 10485760; // 10MB default

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxSize) {
        alert(`File size must be less than ${(maxSize / 1048576).toFixed(1)}MB`);
        return;
      }
      // In a real implementation, you would upload the file to a server
      // For now, just store the filename
      onChange({ text: file.name, file_url: URL.createObjectURL(file) });
    }
  };

  return (
    <div style={{
      marginBottom: hideLabel ? '0' : '48px',
      transition: 'all 0.2s'
    }}>
      {!hideLabel && (
        <>
          <label style={{
            display: 'block',
            fontSize: '16px',
            fontWeight: '500',
            color: '#000000',
            marginBottom: '8px',
            letterSpacing: '-0.01em'
          }}>
            {question.question_text}
            {question.required && <span style={{ color: effectiveAccent, marginLeft: '4px' }}>*</span>}
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
        </>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          disabled={disabled}
          required={question.required}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          style={{
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '500',
            color: effectiveAccent,
            background: 'transparent',
            border: `1px solid ${effectiveAccent}`,
            borderRadius: '8px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = `${effectiveAccent}10`)}
          onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = 'transparent')}
        >
          Choose File
        </button>
        {fileName && (
          <span style={{
            fontSize: '14px',
            color: '#6b7280'
          }}>
            {fileName}
          </span>
        )}
      </div>
      <div style={{
        fontSize: '12px',
        color: '#9ca3af',
        marginTop: '6px'
      }}>
        Max size: {(maxSize / 1048576).toFixed(1)}MB
      </div>
    </div>
  );
};

