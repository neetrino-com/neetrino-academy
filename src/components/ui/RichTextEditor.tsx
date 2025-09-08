'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';

// Динамический импорт для избежания проблем с SSR
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Введите текст...",
  className = ""
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Показываем обычный textarea во время загрузки
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${className}`}
      />
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        placeholder={placeholder}
        data-color-mode="light"
        height={200}
        visibleDragBar={false}
        toolbarHeight={40}
        preview="edit"
        hideToolbar={false}
        textareaProps={{
          placeholder: placeholder,
          style: {
            fontSize: 14,
            lineHeight: 1.6,
          },
        }}
        commands={[
          // Основные команды форматирования
          {
            name: 'bold',
            keyCommand: 'bold',
            buttonProps: { 'aria-label': 'Жирный текст', title: 'Жирный текст' },
            icon: <span style={{ fontWeight: 'bold' }}>B</span>,
          },
          {
            name: 'italic',
            keyCommand: 'italic',
            buttonProps: { 'aria-label': 'Курсив', title: 'Курсив' },
            icon: <span style={{ fontStyle: 'italic' }}>I</span>,
          },
          {
            name: 'strikethrough',
            keyCommand: 'strikethrough',
            buttonProps: { 'aria-label': 'Зачеркнутый', title: 'Зачеркнутый' },
            icon: <span style={{ textDecoration: 'line-through' }}>S</span>,
          },
          {
            name: 'divider',
            keyCommand: 'divider',
            render: () => <div style={{ width: 1, height: 20, backgroundColor: '#ddd', margin: '0 4px' }} />,
          },
          {
            name: 'h1',
            keyCommand: 'title1',
            buttonProps: { 'aria-label': 'Заголовок 1', title: 'Заголовок 1' },
            icon: <span style={{ fontSize: '18px', fontWeight: 'bold' }}>H1</span>,
          },
          {
            name: 'h2',
            keyCommand: 'title2',
            buttonProps: { 'aria-label': 'Заголовок 2', title: 'Заголовок 2' },
            icon: <span style={{ fontSize: '16px', fontWeight: 'bold' }}>H2</span>,
          },
          {
            name: 'h3',
            keyCommand: 'title3',
            buttonProps: { 'aria-label': 'Заголовок 3', title: 'Заголовок 3' },
            icon: <span style={{ fontSize: '14px', fontWeight: 'bold' }}>H3</span>,
          },
          {
            name: 'divider',
            keyCommand: 'divider2',
            render: () => <div style={{ width: 1, height: 20, backgroundColor: '#ddd', margin: '0 4px' }} />,
          },
          {
            name: 'unorderedListCommand',
            keyCommand: 'unorderedListCommand',
            buttonProps: { 'aria-label': 'Маркированный список', title: 'Маркированный список' },
            icon: <span>•</span>,
          },
          {
            name: 'orderedListCommand',
            keyCommand: 'orderedListCommand',
            buttonProps: { 'aria-label': 'Нумерованный список', title: 'Нумерованный список' },
            icon: <span>1.</span>,
          },
          {
            name: 'divider',
            keyCommand: 'divider3',
            render: () => <div style={{ width: 1, height: 20, backgroundColor: '#ddd', margin: '0 4px' }} />,
          },
          {
            name: 'link',
            keyCommand: 'link',
            buttonProps: { 'aria-label': 'Ссылка', title: 'Ссылка' },
            icon: <span>🔗</span>,
          },
          {
            name: 'quote',
            keyCommand: 'quote',
            buttonProps: { 'aria-label': 'Цитата', title: 'Цитата' },
            icon: <span>"</span>,
          },
          {
            name: 'code',
            keyCommand: 'code',
            buttonProps: { 'aria-label': 'Код', title: 'Код' },
            icon: <span>{ }</span>,
          },
        ]}
      />
    </div>
  );
}
