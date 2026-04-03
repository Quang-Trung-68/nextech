import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import {
  Bold,
  Italic,
  Strikethrough as StrikethroughIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo2,
  Redo2,
  Underline as UnderlineIcon,
  ImageIcon,
  Loader2,
} from 'lucide-react';

/**
 * Replace first image node with matching src (e.g. blob URL → Cloudinary URL).
 */
function replaceImageSrcInDoc(editor, oldSrc, newSrc) {
  const { state } = editor;
  const tr = state.tr;
  let found = false;
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'image' && node.attrs.src === oldSrc) {
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: newSrc });
      found = true;
      return false;
    }
    return true;
  });
  if (found) {
    editor.view.dispatch(tr);
  }
}

function deleteImageBySrc(editor, src) {
  const { state } = editor;
  let delFrom = null;
  let delTo = null;
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'image' && node.attrs.src === src) {
      delFrom = pos;
      delTo = pos + node.nodeSize;
      return false;
    }
    return true;
  });
  if (delFrom != null) {
    editor.view.dispatch(state.tr.delete(delFrom, delTo));
  }
}

/**
 * Rich HTML editor for news body (stored as sanitized HTML on server).
 */
export function NewsEditor({ value = '', onChange, disabled = false, className }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  /** Tránh đồng bộ value từ form → setContent ngay sau khi user/editor vừa cập nhật (gây nhấp nháy). */
  const skipNextExternalSyncRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: 'Viết nội dung bài viết...',
      }),
    ],
    content: value || '<p></p>',
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      skipNextExternalSyncRef.current = true;
      onChange?.(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (skipNextExternalSyncRef.current) {
      skipNextExternalSyncRef.current = false;
      return;
    }
    const current = editor.getHTML();
    const next = value || '<p></p>';
    if (next !== current) {
      editor.commands.setContent(next, false);
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  const uploadInlineImage = useCallback(
    async (file) => {
      if (!editor || !file.type.startsWith('image/')) return;
      const blobUrl = URL.createObjectURL(file);
      editor.chain().focus().setImage({ src: blobUrl, alt: file.name }).run();

      const fd = new FormData();
      fd.append('coverImage', file);
      try {
        setUploading(true);
        const { data } = await axiosInstance.post('/admin/posts/upload-cover', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const url = data.data?.url;
        if (!url) throw new Error('Không nhận được URL ảnh');
        replaceImageSrcInDoc(editor, blobUrl, url);
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        toast.error(e.response?.data?.message || e.message || 'Tải ảnh thất bại');
        deleteImageBySrc(editor, blobUrl);
        URL.revokeObjectURL(blobUrl);
      } finally {
        setUploading(false);
      }
    },
    [editor, onChange],
  );

  const onPickImage = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void uploadInlineImage(file);
  };

  if (!editor) {
    return (
      <div className={cn('min-h-[280px] rounded-md border border-input bg-muted/30 animate-pulse', className)} />
    );
  }

  return (
    <div className={cn('rounded-md border border-input bg-background overflow-hidden', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={onFileChange}
      />
      <div className="flex flex-wrap gap-0.5 border-b border-input bg-muted/40 p-2">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
        >
          <Bold size={16} />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
        >
          <Italic size={16} />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={disabled}
        >
          <UnderlineIcon size={16} />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
        >
          <StrikethroughIcon size={16} />
        </Button>
        <span className="w-px h-6 bg-border mx-1 self-center" />
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
        >
          <Heading2 size={16} />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
        >
          <Heading3 size={16} />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
        >
          <List size={16} />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
        >
          <ListOrdered size={16} />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
        >
          <Quote size={16} />
        </Button>
        <span className="w-px h-6 bg-border mx-1 self-center" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2"
          onClick={onPickImage}
          disabled={disabled || uploading}
          title="Chèn ảnh vào bài (JPEG, PNG, WebP)"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
          <span className="text-xs hidden sm:inline">Ảnh</span>
        </Button>
        <span className="w-px h-6 bg-border mx-1 self-center" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
        >
          <Undo2 size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
        >
          <Redo2 size={16} />
        </Button>
      </div>
      <EditorContent
        editor={editor}
        className="news-rich-body prose prose-sm sm:prose max-w-none dark:prose-invert px-3 py-2 min-h-[260px] focus-within:outline-none [&_.ProseMirror]:min-h-[240px] [&_.ProseMirror]:outline-none"
      />
    </div>
  );
}
