import React, { useMemo } from 'react';

interface DataPoint {
  date: string;
  views: number;
  submissions: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ data, height = 300 }) => {
  const { paths, maxValue, dates } = useMemo(() => {
    if (!data || data.length === 0) {
      return { paths: { views: '', submissions: '' }, maxValue: 0, dates: [] };
    }

    const maxViews = Math.max(...data.map(d => d.views));
    const maxSubmissions = Math.max(...data.map(d => d.submissions));
    const max = Math.max(maxViews, maxSubmissions, 1);

    const width = 800;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const xStep = chartWidth / (data.length - 1 || 1);
    
    const viewsPath = data.map((point, i) => {
      const x = padding + i * xStep;
      const y = padding + chartHeight - (point.views / max) * chartHeight;
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    const submissionsPath = data.map((point, i) => {
      const x = padding + i * xStep;
      const y = padding + chartHeight - (point.submissions / max) * chartHeight;
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    return {
      paths: { views: viewsPath, submissions: submissionsPath },
      maxValue: max,
      dates: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    };
  }, [data, height]);

  if (!data || data.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '14px'
      }}>
        No data available
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg width="100%" height={height} viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        <defs>
          <linearGradient id="viewsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="submissionsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = 40 + (i * (height - 80) / 4);
          return (
            <line
              key={i}
              x1="40"
              y1={y}
              x2="760"
              y2={y}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          );
        })}

        {/* Views area fill */}
        <path
          d={`${paths.views} L 760,${height - 40} L 40,${height - 40} Z`}
          fill="url(#viewsGradient)"
          opacity="0.5"
        />

        {/* Submissions area fill */}
        <path
          d={`${paths.submissions} L 760,${height - 40} L 40,${height - 40} Z`}
          fill="url(#submissionsGradient)"
          opacity="0.5"
        />

        {/* Views line */}
        <path
          d={paths.views}
          fill="none"
          stroke="#9333ea"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Submissions line */}
        <path
          d={paths.submissions}
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((point, i) => {
          const x = 40 + i * (720 / (data.length - 1 || 1));
          const yViews = 40 + (height - 80) - (point.views / maxValue) * (height - 80);
          const ySubmissions = 40 + (height - 80) - (point.submissions / maxValue) * (height - 80);
          
          return (
            <g key={i}>
              <circle cx={x} cy={yViews} r="4" fill="#9333ea" />
              <circle cx={x} cy={ySubmissions} r="4" fill="#10b981" />
            </g>
          );
        })}

        {/* X-axis labels */}
        {dates.map((date, i) => {
          if (dates.length > 15 && i % 2 !== 0) return null; // Show every other label if too many
          const x = 40 + i * (720 / (data.length - 1 || 1));
          return (
            <text
              key={i}
              x={x}
              y={height - 15}
              textAnchor="middle"
              fontSize="11"
              fill="#9ca3af"
              fontWeight="500"
            >
              {date}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '24px',
        justifyContent: 'center',
        marginTop: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#9333ea'
          }} />
          <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Views</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#10b981'
          }} />
          <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Submissions</span>
        </div>
      </div>
    </div>
  );
};
