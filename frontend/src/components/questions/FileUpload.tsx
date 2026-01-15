import React, { useRef, useState } from 'react';
import { QuestionProps } from './ShortAnswer';
import { config } from '../../config';

export const FileUpload: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  hideLabel = false,
  accentColor = '#9333ea',
  boldTextColor,
  uploadContext
}) => {
  const effectiveAccent = boldTextColor || accentColor;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileName = value?.text || value?.files?.[0]?.filename || value?.files?.[0]?.original_filename || '';
  const acceptedTypes = question.settings?.file_types?.join(',') || '*';
  const maxSize = question.settings?.max_file_size || 10485760; // 10MB default

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxSize) {
        alert(`File size must be less than ${(maxSize / 1048576).toFixed(1)}MB`);
        return;
      }

      if (!uploadContext?.token) {
        onChange({ text: file.name });
        return;
      }

      setIsUploading(true);
      setUploadError('');

      try {
        const createRes = await fetch(
          `${config.backendUrl}/api/public/forms/${uploadContext.token}/uploads`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question_id: question.id,
              filename: file.name,
              content_type: file.type || undefined,
              size_bytes: file.size
            })
          }
        );

        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to create upload');
        }

        const createData = await createRes.json();
        const uploadUrl = createData.upload_url;

        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: file.type ? { 'Content-Type': file.type } : undefined,
          body: file
        });

        if (!putRes.ok) {
          throw new Error('Failed to upload file');
        }

        await fetch(
          `${config.backendUrl}/api/public/forms/${uploadContext.token}/uploads/${createData.upload_id}/complete`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content_type: file.type || undefined,
              size_bytes: file.size
            })
          }
        );

        onChange({
          text: file.name,
          files: [
            {
              upload_id: createData.upload_id,
              filename: file.name,
              content_type: file.type || undefined,
              size_bytes: file.size
            }
          ]
        });
      } catch (err: any) {
        setUploadError(err.message || 'Upload failed');
      } finally {
        setIsUploading(false);
      }
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
          disabled={disabled || isUploading}
          required={question.required}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          style={{
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '500',
            color: effectiveAccent,
            background: 'transparent',
            border: `1px solid ${effectiveAccent}`,
            borderRadius: '8px',
            cursor: (disabled || isUploading) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => (!disabled && !isUploading) && (e.currentTarget.style.background = `${effectiveAccent}10`)}
          onMouseLeave={(e) => (!disabled && !isUploading) && (e.currentTarget.style.background = 'transparent')}
        >
          {isUploading ? 'Uploading...' : 'Choose File'}
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
      {uploadError && (
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#dc2626'
        }}>
          {uploadError}
        </div>
      )}
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
