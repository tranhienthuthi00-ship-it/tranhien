import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Quote, Undo, Redo } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b-2 border-[#141414]/10 bg-gray-50/50 rounded-t-xl">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('bold') ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('italic') ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('strike') ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="Strike"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      
      <div className="w-px h-4 bg-[#141414]/20 mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-[#141414]/20 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('bulletList') ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('orderedList') ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="Ordered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('blockquote') ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-[#141414]/20 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded-md text-[#666] hover:bg-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed"
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded-md text-[#666] hover:bg-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed"
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
};

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 font-sans text-[#141414]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border-2 border-[#141414]/30 rounded-xl overflow-hidden bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
}
