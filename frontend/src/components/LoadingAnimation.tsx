import React, { useEffect, useState } from 'react';

interface LoadingAnimationProps {
  className?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ className }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Analyzing your request...',
    'Planning form structure...',
    'Creating questions...',
    'Setting up logic...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={className} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 20px',
      gap: '32px'
    }}>
      {/* Minimal Loading Text Above Skeleton */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px'
      }}>
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid #e9d5ff',
            borderTop: '2px solid #9333ea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <span style={{
          fontSize: '15px',
          fontWeight: '500',
          color: '#1f2937'
        }}>
          {steps[currentStep]}
        </span>
      </div>

      {/* Skeleton Cards */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '600px'
      }}>
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} delay={i * 200} />
        ))}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -468px 0;
          }
          100% {
            background-position: 468px 0;
          }
        }
      `}</style>
    </div>
  );
};

interface SkeletonCardProps {
  delay: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ delay }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        padding: '24px',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        animation: 'fadeInUp 0.4s ease-out',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Question Title Skeleton */}
      <div
        style={{
          height: '20px',
          width: '70%',
          background: 'linear-gradient(to right, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
          backgroundSize: '800px 100%',
          animation: 'shimmer 1.5s ease-in-out infinite',
          borderRadius: '4px',
          marginBottom: '12px'
        }}
      />
      
      {/* Description Skeleton */}
      <div
        style={{
          height: '14px',
          width: '90%',
          background: 'linear-gradient(to right, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
          backgroundSize: '800px 100%',
          animation: 'shimmer 1.5s ease-in-out infinite',
          borderRadius: '4px',
          marginBottom: '16px'
        }}
      />

      {/* Input Field Skeleton */}
      <div
        style={{
          height: '40px',
          width: '100%',
          background: 'linear-gradient(to right, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
          backgroundSize: '800px 100%',
          animation: 'shimmer 1.5s ease-in-out infinite',
          borderRadius: '6px'
        }}
      />
    </div>
  );
};
