'use client'

import { useMemo } from 'react'

interface DataPoint {
  label: string
  value: number
}

interface SimpleChartProps {
  data: DataPoint[]
  type?: 'bar' | 'line'
  height?: number
  color?: string
  showValues?: boolean
  title?: string
}

export default function SimpleChart({ 
  data, 
  type = 'bar', 
  height = 200, 
  color = '#4F46E5',
  showValues = false,
  title 
}: SimpleChartProps) {
  const { maxValue, chartData } = useMemo(() => {
    const max = Math.max(...data.map(d => d.value))
    const chartHeight = height - 40 // Оставляем место для подписей
    
    const processedData = data.map(d => ({
      ...d,
      percentage: max > 0 ? (d.value / max) * 100 : 0,
      barHeight: max > 0 ? (d.value / max) * chartHeight : 0
    }))

    return { maxValue: max, chartData: processedData }
  }, [data, height])

  if (data.length === 0) {
    return (
      <div className="w-full bg-gray-100 rounded-lg p-6 flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500">Нет данных для отображения</p>
      </div>
    )
  }

  if (type === 'line') {
    return <LineChart data={chartData} height={height} color={color} title={title} showValues={showValues} />
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
      )}
      <div className="relative bg-white rounded-lg p-4 border" style={{ height }}>
        <div className="flex items-end justify-between h-full space-x-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="relative w-full flex items-end justify-center">
                {showValues && item.value > 0 && (
                  <span 
                    className="absolute text-xs font-medium text-gray-700 mb-1"
                    style={{ bottom: item.barHeight + 5 }}
                  >
                    {item.value}
                  </span>
                )}
                <div
                  className="w-full rounded-t-md transition-all duration-300 hover:opacity-80"
                  style={{
                    height: item.barHeight,
                    backgroundColor: color,
                    minHeight: item.value > 0 ? '4px' : '0px'
                  }}
                />
              </div>
              <span className="text-xs text-gray-600 mt-2 text-center leading-tight">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LineChart({ data, height, color, title, showValues }: {
  data: Array<{ label: string; value: number; percentage: number; barHeight: number }>
  height: number
  color: string
  title?: string
  showValues: boolean
}) {
  const chartHeight = height - 60
  const chartWidth = 400

  const points = data.map((item, index) => ({
    x: (index / (data.length - 1)) * chartWidth,
    y: chartHeight - item.barHeight,
    value: item.value,
    label: item.label
  }))

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ')

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
      )}
      <div className="bg-white rounded-lg p-4 border overflow-hidden">
        <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} className="w-full">
          {/* Сетка */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height={chartHeight} fill="url(#grid)" />
          
          {/* Линия */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Точки */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill={color}
                stroke="white"
                strokeWidth="2"
              />
              {showValues && (
                <text
                  x={point.x}
                  y={point.y - 10}
                  textAnchor="middle"
                  className="text-xs fill-gray-700 font-medium"
                >
                  {point.value}
                </text>
              )}
            </g>
          ))}
          
          {/* Подписи по X */}
          {points.map((point, index) => (
            <text
              key={index}
              x={point.x}
              y={height - 10}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}
