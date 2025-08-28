'use client'

import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
  trend?: {
    value: number
    isPositive: boolean
  }
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    accent: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-100',
    iconColor: 'text-green-600',
    accent: 'text-green-600'
  },
  yellow: {
    bg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    accent: 'text-yellow-600'
  },
  red: {
    bg: 'bg-red-100',
    iconColor: 'text-red-600',
    accent: 'text-red-600'
  },
  purple: {
    bg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    accent: 'text-purple-600'
  },
  indigo: {
    bg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    accent: 'text-indigo-600'
  }
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'blue',
  trend 
}: StatCardProps) {
  const colors = colorClasses[color]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">
                за период
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.iconColor}`} />
        </div>
      </div>
    </div>
  )
}
