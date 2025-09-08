'use client';

import { useRef, useEffect } from 'react';
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
            'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
            'textcolor', 'colorpicker', 'textpattern', 'nonbreaking', 'pagebreak',
            'directionality', 'template', 'paste', 'textcolor'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help | link image | emoticons | code | fullscreen',
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; line-height: 1.6; }',
          placeholder: placeholder,
          branding: false,
          statusbar: false,
          resize: false,
          elementpath: false,
          content_css: false,
          skin: 'oxide',
          content_css_cors: true,
          paste_data_images: true,
          paste_auto_cleanup_on_paste: true,
          paste_remove_styles_if_webkit: false,
          paste_remove_empty_paragraphs: true,
          paste_convert_word_fake_lists: true,
          paste_merge_formats: true,
          paste_webkit_styles: "all",
          paste_retain_style_properties: "color font-size font-family background-color",
          setup: (editor) => {
            editor.on('init', () => {
              editor.getContainer().style.border = '1px solid #d1d5db';
              editor.getContainer().style.borderRadius = '0.5rem';
            });
          },
          // Русская локализация
          language: 'ru',
          // Настройки для лучшего UX
          quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
          quickbars_insert_toolbar: 'quickimage quicktable',
          // Настройки изображений
          image_advtab: true,
          image_caption: true,
          image_title: true,
          // Настройки ссылок
          link_title: true,
          link_list: [
            { title: 'Внутренняя ссылка', value: '/internal-link' },
            { title: 'Внешняя ссылка', value: 'https://example.com' }
          ],
          // Настройки таблиц
          table_default_attributes: {
            border: '1'
          },
          table_default_styles: {
            'border-collapse': 'collapse',
            'width': '100%'
          },
          // Настройки для мобильных устройств
          mobile: {
            theme: 'mobile',
            plugins: ['autosave', 'lists', 'autolink'],
            toolbar: ['undo', 'bold', 'italic', 'styleselect']
          }
        }}
      />
    </div>
  );
}
