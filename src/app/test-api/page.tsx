'use client';

import { useState } from 'react';

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGetProgress = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/student/checklists/checklist2/progress');
      const data = await response.json();
      setResult({ method: 'GET', status: response.status, data });
    } catch (error) {
      setResult({ method: 'GET', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testUpdateProgress = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/student/checklists/checklist2/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: 'test-item', status: 'COMPLETED' })
      });
      const data = await response.json();
      setResult({ method: 'PUT', status: response.status, data });
    } catch (error) {
      setResult({ method: 'PUT', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Тест API чеклиста</h1>
      
      <div className="space-y-4">
        <button
          onClick={testGetProgress}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Тест GET прогресса'}
        </button>
        
        <button
          onClick={testUpdateProgress}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Тест PUT прогресса'}
        </button>
      </div>

      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Результат:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
