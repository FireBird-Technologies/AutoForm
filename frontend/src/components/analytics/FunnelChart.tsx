import React from 'react';

interface FunnelStep {
  label: string;
  value: number;
  percentage: number;
  dropOff?: number;
}

interface FunnelChartProps {
  stages: FunnelStep[];
  totalViews: number;
  height?: number;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ stages, totalViews, height = 400 }) => {
  if (!stages || stages.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '14px'
      }}>
        No funnel data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {stages.map((stage, index) => {
        const isFirst = index === 0;
        const isLast = index === stages.length - 1;
        const showDropOff = !isLast && stage.dropOff !== undefined && stage.dropOff > 0;

        return (
          <div key={index} style={{ marginBottom: index < stages.length - 1 ? '16px' : '0' }}>
            {/* Stage Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: showDropOff ? '8px' : '0'
            }}>
              {/* Label & Value */}
              <div style={{
                minWidth: '160px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827'
              }}>
                {stage.label}
              </div>

              <div style={{
                minWidth: '100px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280'
              }}>
                {stage.value.toLocaleString()} users
              </div>

              {/* Bar Container */}
              <div style={{
                flex: 1,
                height: '40px',
                background: '#f3f4f6',
                borderRadius: '8px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Bar Fill */}
                <div
                  style={{
                    height: '100%',
                    width: `${stage.percentage}%`,
                    background: isLast 
                      ? 'linear-gradient(90deg, #6b7280 0%, #4b5563 100%)'
                      : 'linear-gradient(90deg, #9333ea 0%, #7e22ce 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '12px',
                    position: 'relative',
                    transition: 'width 0.6s ease'
                  }}
                >
                  {/* Percentage Label Inside Bar */}
                  {stage.percentage > 20 && (
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: 'white',
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}>
                      {stage.percentage.toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Percentage Label Outside Bar (for small percentages) */}
                {stage.percentage <= 20 && (
                  <div style={{
                    position: 'absolute',
                    right: '-50px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#6b7280'
                  }}>
                    {stage.percentage.toFixed(0)}%
                  </div>
                )}
              </div>

              {/* Percentage on Right */}
              <div style={{
                minWidth: '60px',
                textAlign: 'right',
                fontSize: '16px',
                fontWeight: '700',
                color: '#111827'
              }}>
                {stage.percentage.toFixed(0)}%
              </div>
            </div>

            {/* Drop-off Text */}
            {showDropOff && (
              <div style={{
                marginLeft: '276px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#6b7280'
              }}>
                {stage.dropOff && stage.dropOff > 0 ? `-${stage.dropOff.toFixed(0)}% drop-off` : ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
