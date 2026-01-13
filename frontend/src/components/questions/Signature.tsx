import React, { useRef, useState, useEffect } from 'react';
import { QuestionProps } from './ShortAnswer';

export const Signature: React.FC<QuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  hideLabel = false,
  accentColor = '#9333ea',
  boldTextColor
}) => {
  const effectiveAccent = boldTextColor || accentColor;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value?.signature);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas with proper line settings
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature if available
    if (value?.signature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value.signature;
    }
  }, [value?.signature]);

  const getScaledCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getScaledCoordinates(e.clientX, e.clientY);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getScaledCoordinates(e.clientX, e.clientY);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    setHasSignature(true);

    const canvas = canvasRef.current;
    if (canvas) {
      const signature = canvas.toDataURL('image/png');
      onChange({ signature });
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const touch = e.touches[0];
    const { x, y } = getScaledCoordinates(touch.clientX, touch.clientY);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const touch = e.touches[0];
    const { x, y } = getScaledCoordinates(touch.clientX, touch.clientY);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange({ signature: '' });
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={250}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDrawing}
          style={{
            width: '100%',
            maxWidth: '600px',
            height: 'auto',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            cursor: disabled ? 'not-allowed' : 'crosshair',
            touchAction: 'none',
            background: '#ffffff'
          }}
        />
        {hasSignature && !disabled && (
          <button
            type="button"
            onClick={clearSignature}
            style={{
              alignSelf: 'flex-start',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#6b7280',
              background: 'transparent',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = effectiveAccent;
              e.currentTarget.style.color = effectiveAccent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
