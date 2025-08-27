'use client'

import { useState, useEffect } from 'react'

interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}

interface QuizQuestion {
  id: string
  question: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE'
  points: number
  options: QuizOption[]
}

interface Quiz {
  id: string
  title: string
  description?: string
  timeLimit?: number
  passingScore: number
  questions: QuizQuestion[]
}

interface QuizProps {
  quiz: Quiz
  onComplete: (score: number, maxScore: number, passed: boolean) => void
  className?: string
}

export default function Quiz({ quiz, onComplete, className = '' }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)

  useEffect(() => {
    // Вычисляем максимальный балл
    const totalPoints = quiz.questions.reduce((sum, question) => sum + question.points, 0)
    setMaxScore(totalPoints)

    // Запускаем таймер, если есть ограничение по времени
    if (timeLeft !== null) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(timer)
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [quiz, timeLeft])

  const currentQuestion = quiz.questions[currentQuestionIndex]

  const handleAnswerChange = (questionId: string, optionId: string, isMultiple: boolean) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionId] || []
      
      if (isMultiple) {
        // Для множественного выбора
        const newAnswers = currentAnswers.includes(optionId)
          ? currentAnswers.filter(id => id !== optionId)
          : [...currentAnswers, optionId]
        return { ...prev, [questionId]: newAnswers }
      } else {
        // Для одиночного выбора
        return { ...prev, [questionId]: [optionId] }
      }
    })
  }

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = () => {
    // Вычисляем результат
    let totalScore = 0
    
    quiz.questions.forEach(question => {
      const userAnswers = answers[question.id] || []
      const correctAnswers = question.options.filter(option => option.isCorrect).map(option => option.id)
      
      if (question.type === 'MULTIPLE_CHOICE') {
        // Для множественного выбора все ответы должны быть правильными
        const isCorrect = userAnswers.length === correctAnswers.length &&
          userAnswers.every(answer => correctAnswers.includes(answer))
        if (isCorrect) {
          totalScore += question.points
        }
      } else {
        // Для одиночного выбора и true/false
        const isCorrect = userAnswers.length === 1 && correctAnswers.includes(userAnswers[0])
        if (isCorrect) {
          totalScore += question.points
        }
      }
    })

    setScore(totalScore)
    const passed = (totalScore / maxScore) * 100 >= quiz.passingScore
    setIsCompleted(true)
    onComplete(totalScore, maxScore, passed)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isCompleted) {
    const percentage = (score / maxScore) * 100
    const passed = percentage >= quiz.passingScore

    return (
      <div className={`bg-white rounded-lg shadow-sm p-8 ${className}`}>
        <div className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {passed ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <h2 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {passed ? 'Тест пройден!' : 'Тест не пройден'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            Ваш результат: {score} из {maxScore} баллов ({percentage.toFixed(1)}%)
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Результаты по вопросам:</h3>
            <div className="space-y-2">
              {quiz.questions.map((question, index) => {
                const userAnswers = answers[question.id] || []
                const correctAnswers = question.options.filter(option => option.isCorrect).map(option => option.id)
                const isCorrect = userAnswers.length === correctAnswers.length &&
                  userAnswers.every(answer => correctAnswers.includes(answer))
                
                return (
                  <div key={question.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Вопрос {index + 1}: {question.question.substring(0, 50)}...
                    </span>
                    <span className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          
          {!passed && (
            <p className="text-sm text-gray-500 mb-4">
              Для прохождения теста необходимо набрать минимум {quiz.passingScore}%
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Заголовок теста */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{quiz.title}</h2>
            {quiz.description && (
              <p className="text-gray-600 mt-1">{quiz.description}</p>
            )}
          </div>
          {timeLeft !== null && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Осталось времени</div>
              <div className={`text-lg font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          )}
        </div>
        
        {/* Прогресс */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Вопрос {currentQuestionIndex + 1} из {quiz.questions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Вопрос */}
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {currentQuestion.question}
          </h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isMultiple = currentQuestion.type === 'MULTIPLE_CHOICE'
              const isSelected = (answers[currentQuestion.id] || []).includes(option.id)
              
              return (
                <label
                  key={option.id}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type={isMultiple ? 'checkbox' : 'radio'}
                    name={currentQuestion.id}
                    value={option.id}
                    checked={isSelected}
                    onChange={() => handleAnswerChange(currentQuestion.id, option.id, isMultiple)}
                    className={`mt-1 ${
                      isMultiple ? 'rounded' : 'rounded-full'
                    } border-gray-300 text-blue-600 focus:ring-blue-500`}
                  />
                  <span className="ml-3 text-gray-900">{option.text}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Навигация */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Назад
          </button>
          
          <div className="flex space-x-3">
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Следующий →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Завершить тест
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
