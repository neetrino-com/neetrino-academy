'use client';

import { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface TinyMCEEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
}

export default function TinyMCEEditor({ 
  value, 
  onChange, 
  placeholder = "Введите текст...",
  className = "",
  height = 300
}: TinyMCEEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorChange = (content: string) => {
    onChange(content);
  };

  return (
    <div className={`w-full ${className}`}>
      <Editor
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={handleEditorChange}
        init={{
          height: height,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help | link image | code | fullscreen',
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; line-height: 1.6; }',
          placeholder: placeholder,
          branding: false,
          statusbar: false,
          resize: false,
          elementpath: false,
          content_css: false,
          skin: 'oxide',
          // Используем GPL лицензию для открытого исходного кода
          license_key: 'gpl',
          // Русская локализация
          language: 'ru',
          setup: (editor) => {
            editor.on('init', () => {
              editor.getContainer().style.border = '1px solid #d1d5db';
              editor.getContainer().style.borderRadius = '0.5rem';
            });
          },
          // Настройки изображений
          image_advtab: true,
          image_caption: true,
          image_title: true,
          // Настройки ссылок
          link_title: true,
          // Настройки таблиц
          table_default_attributes: {
            border: '1'
          },
          table_default_styles: {
            'border-collapse': 'collapse',
            'width': '100%'
          }
        }}
      />
    </div>
  );
}