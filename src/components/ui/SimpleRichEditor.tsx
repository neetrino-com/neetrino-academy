'use client';

import { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Link, 
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';

interface SimpleRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
}

export default function SimpleRichEditor({ 
  value, 
  onChange, 
  placeholder = "Введите текст...",
  className = "",
  height = 300
}: SimpleRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Введите URL ссылки:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertHeading = (level: number) => {
    execCommand('formatBlock', `h${level}`);
  };

  const toolbarButtons = [
    {
      icon: <Bold size={16} />,
      command: 'bold',
      title: 'Жирный'
    },
    {
      icon: <Italic size={16} />,
      command: 'italic',
      title: 'Курсив'
    },
    {
      icon: <Underline size={16} />,
      command: 'underline',
      title: 'Подчеркнутый'
    },
    { separator: true },
    {
      icon: <Heading1 size={16} />,
      command: () => insertHeading(1),
      title: 'Заголовок 1'
    },
    {
      icon: <Heading2 size={16} />,
      command: () => insertHeading(2),
      title: 'Заголовок 2'
    },
    {
      icon: <Heading3 size={16} />,
      command: () => insertHeading(3),
      title: 'Заголовок 3'
    },
    { separator: true },
    {
      icon: <AlignLeft size={16} />,
      command: 'justifyLeft',
      title: 'По левому краю'
    },
    {
      icon: <AlignCenter size={16} />,
      command: 'justifyCenter',
      title: 'По центру'
    },
    {
      icon: <AlignRight size={16} />,
      command: 'justifyRight',
      title: 'По правому краю'
    },
    {
      icon: <AlignJustify size={16} />,
      command: 'justifyFull',
      title: 'По ширине'
    },
    { separator: true },
    {
      icon: <List size={16} />,
      command: 'insertUnorderedList',
      title: 'Маркированный список'
    },
    {
      icon: <ListOrdered size={16} />,
      command: 'insertOrderedList',
      title: 'Нумерованный список'
    },
    {
      icon: <Quote size={16} />,
      command: 'formatBlock',
      value: 'blockquote',
      title: 'Цитата'
    },
    { separator: true },
    {
      icon: <Link size={16} />,
      command: insertLink,
      title: 'Ссылка'
    },
    {
      icon: <Code size={16} />,
      command: 'formatBlock',
      value: 'pre',
      title: 'Код'
    }
  ];

  return (
    <div className={`w-full border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Панель инструментов */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1">
        {toolbarButtons.map((button, index) => {
          if (button.separator) {
            return (
              <div key={index} className="w-px h-6 bg-gray-300 mx-1" />
            );
          }
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (typeof button.command === 'function') {
                  button.command();
                } else {
                  execCommand(button.command, button.value);
                }
              }}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title={button.title}
            >
              {button.icon}
            </button>
          );
        })}
      </div>

      {/* Область редактирования */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`p-4 outline-none min-h-[${height}px] ${
          isFocused ? 'bg-white' : 'bg-white'
        }`}
        style={{ minHeight: `${height}px` }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
      
      {/* Стили для placeholder */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
