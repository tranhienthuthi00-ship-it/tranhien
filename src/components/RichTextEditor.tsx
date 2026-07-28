import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Quote, 
  Undo, 
  Redo,
  Table as TableIcon,
  Plus,
  Trash2,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);

  if (!editor) return null;

  const isTableActive = editor.isActive('table');

  const insertCustomTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setShowTableMenu(false);
  };

  const insertPresetVocabularyTable = () => {
    editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run();
    // Fill headers in new table if possible
    setShowTableMenu(false);
  };

  const insertPresetGrammarTable = () => {
    editor.chain().focus().insertTable({ rows: 4, cols: 3, withHeaderRow: true }).run();
    setShowTableMenu(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b-2 border-[#141414]/10 bg-gray-50/80 rounded-t-xl relative">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('bold') ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="In đậm (Bold)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('italic') ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="In nghiêng (Italic)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('strike') ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="Gạch ngang (Strikethrough)"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      
      <div className="w-px h-4 bg-[#141414]/20 mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="Tiêu đề 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="Tiêu đề 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-[#141414]/20 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('bulletList') ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="Danh sách gạch đầu dòng"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('orderedList') ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="Danh sách số"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded-md transition-colors ${editor.isActive('blockquote') ? 'bg-[#141414] text-white' : 'text-[#666] hover:bg-[#E5E5E5]'}`}
        title="Trích dẫn"
      >
        <Quote className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-[#141414]/20 mx-1" />

      {/* TABLE BUTTON & POPUP MENU */}
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setShowTableMenu(!showTableMenu)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold transition-all border ${
            isTableActive 
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
              : 'bg-white text-[#141414] border-gray-300 hover:bg-amber-50'
          }`}
          title="Chèn hoặc Quản lý Bảng"
        >
          <TableIcon className="w-4 h-4 text-amber-600" />
          <span>Bảng</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {showTableMenu && (
          <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border-2 border-[#141414] p-3 z-50 text-xs text-[#141414] space-y-2">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-extrabold text-amber-900 uppercase text-[10px] tracking-wider flex items-center gap-1">
                <TableIcon className="w-3.5 h-3.5" /> Quản Lý Bảng
              </span>
              <button 
                type="button"
                onClick={() => setShowTableMenu(false)}
                className="text-gray-400 hover:text-black font-bold text-sm px-1"
              >
                ✕
              </button>
            </div>

            {/* QUICK PRESETS */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500">Mẫu Bảng Nhanh:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => insertCustomTable(2, 2)}
                  className="p-1.5 bg-gray-50 hover:bg-amber-100 rounded-lg border border-gray-200 text-left font-medium transition-colors"
                >
                  📊 Bảng 2x2
                </button>
                <button
                  type="button"
                  onClick={() => insertCustomTable(3, 3)}
                  className="p-1.5 bg-gray-50 hover:bg-amber-100 rounded-lg border border-gray-200 text-left font-medium transition-colors"
                >
                  📊 Bảng 3x3
                </button>
                <button
                  type="button"
                  onClick={insertPresetVocabularyTable}
                  className="p-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 text-left font-semibold text-amber-900 transition-colors col-span-2 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Bảng Từ Vựng (4 cột)</span>
                </button>
              </div>
            </div>

            {/* CUSTOM SIZE */}
            <div className="pt-2 border-t space-y-1.5">
              <span className="text-[10px] font-bold text-gray-500">Tạo Bảng Tùy Chỉnh:</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-[10px] text-gray-600">Hàng:</span>
                  <input 
                    type="number" 
                    min={1} 
                    max={20}
                    value={customRows} 
                    onChange={(e) => setCustomRows(parseInt(e.target.value) || 1)}
                    className="w-12 p-1 border rounded text-center text-xs font-bold"
                  />
                </div>
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-[10px] text-gray-600">Cột:</span>
                  <input 
                    type="number" 
                    min={1} 
                    max={10}
                    value={customCols} 
                    onChange={(e) => setCustomCols(parseInt(e.target.value) || 1)}
                    className="w-12 p-1 border rounded text-center text-xs font-bold"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => insertCustomTable(customRows, customCols)}
                className="w-full py-1.5 bg-[#141414] text-white font-bold rounded-lg hover:bg-black transition-colors"
              >
                + Chèn Bảng {customRows}x{customCols}
              </button>
            </div>

            {/* ACTIVE TABLE ACTIONS */}
            {isTableActive && (
              <div className="pt-2 border-t space-y-1 bg-amber-50/50 p-2 rounded-lg">
                <span className="text-[10px] font-extrabold text-amber-900 block">Thao tác Bảng Đang Chọn:</span>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                    className="p-1 bg-white hover:bg-amber-100 rounded border border-amber-200 text-left flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" /> Thêm hàng trên
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    className="p-1 bg-white hover:bg-amber-100 rounded border border-amber-200 text-left flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" /> Thêm hàng dưới
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                    className="p-1 bg-white hover:bg-amber-100 rounded border border-amber-200 text-left flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-blue-600" /> Thêm cột trái
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    className="p-1 bg-white hover:bg-amber-100 rounded border border-amber-200 text-left flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-blue-600" /> Thêm cột phải
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    className="p-1 bg-white hover:bg-rose-100 rounded border border-rose-200 text-rose-700 text-left flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" /> Xóa hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    className="p-1 bg-white hover:bg-rose-100 rounded border border-rose-200 text-rose-700 text-left flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" /> Xóa cột
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className="p-1 bg-rose-600 text-white rounded font-bold text-left col-span-2 flex items-center justify-center gap-1 hover:bg-rose-700"
                  >
                    <Trash2 className="w-3 h-3" /> Xóa Toàn Bộ Bảng
                  </button>
                </div>
              </div>
            )}

            <div className="pt-1 text-[9.5px] text-gray-500 italic border-t text-center">
              💡 Mẹo: Bạn có thể sao chép & dán trực tiếp bảng từ Excel, Word hoặc trang web vào đây!
            </div>
          </div>
        )}
      </div>

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
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'my-4 w-full border-collapse border-2 border-[#141414] rounded-lg overflow-hidden',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-amber-100 font-bold border border-gray-300 p-2 text-left text-xs uppercase text-amber-950',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2 text-xs text-[#141414]',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[220px] p-4 font-sans text-[#141414] overflow-x-auto',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border-2 border-[#141414]/30 rounded-xl overflow-hidden bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="bg-white min-h-[220px]" />
    </div>
  );
}

