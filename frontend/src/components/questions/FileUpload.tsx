import React, { useRef } from 'react';
import { QuestionProps } from './ShortAnswer';

export const FileUpload: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
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
    <div className="question-wrapper">
      <label className="question-label">
        {question.question_text}
        {question.required && <span className="required-mark">*</span>}
      </label>
      {question.description && (
        <p className="question-description">{question.description}</p>
      )}
      <div className="file-upload-container">
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
          className="file-upload-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          Choose File
        </button>
        {fileName && <span className="file-name">{fileName}</span>}
      </div>
      <div className="input-hint">
        Max size: {(maxSize / 1048576).toFixed(1)}MB
      </div>
    </div>
  );
};

