import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBlockquote,
  IconBold,
  IconCode,
  IconCopy,
  IconH1,
  IconH2,
  IconItalic,
  IconList,
  IconListCheck,
  IconListNumbers,
  IconSourceCode,
  IconStrikethrough,
  type Icon,
} from '@tabler/icons-react';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extensions';
import { Markdown } from '@tiptap/markdown';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { IconButton } from '../ui/IconButton';
import { useToast } from '../ui/Toast';
import { load, save } from './storage';

const STORAGE_KEY = 'stoik-lite.toolbox.notes';

/** Rich text notes. Markdown shortcuts work too: `#`, `-`, `1.`, `[ ]`, `>`, `**bold**`, `` `code` ``. */
export function NotesPanel() {
  const toast = useToast();
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: 'Take notes… Markdown shortcuts work: #, -, [ ], **bold**',
      }),
      Markdown,
    ],
    content: load(STORAGE_KEY) ?? '',
    onUpdate: ({ editor }) => save(STORAGE_KEY, editor.getJSON()),
    editorProps: { attributes: { class: 'notes-editor rich-text', 'aria-label': 'Notes' } },
  });

  async function copyAsMarkdown() {
    try {
      await navigator.clipboard.writeText(editor.getMarkdown());
      toast('Notes copied as Markdown');
    } catch {
      toast('Could not copy the notes', 'error');
    }
  }

  return (
    <>
      <Toolbar editor={editor} onCopy={copyAsMarkdown} />
      <EditorContent editor={editor} className="min-h-0 flex-1 overflow-y-auto" />
    </>
  );
}

type Tool = { label: string; icon: Icon; isActive?: boolean; run: () => void; disabled?: boolean };

function Toolbar({ editor, onCopy }: { editor: Editor; onCopy: () => void }) {
  // Re-render the toolbar when the selection or the content changes.
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      strike: editor.isActive('strike'),
      code: editor.isActive('code'),
      h1: editor.isActive('heading', { level: 1 }),
      h2: editor.isActive('heading', { level: 2 }),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      taskList: editor.isActive('taskList'),
      blockquote: editor.isActive('blockquote'),
      codeBlock: editor.isActive('codeBlock'),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  const groups: Tool[][] = [
    [
      {
        label: 'Bold (⌘B)',
        icon: IconBold,
        isActive: state.bold,
        run: () => chain().toggleBold().run(),
      },
      {
        label: 'Italic (⌘I)',
        icon: IconItalic,
        isActive: state.italic,
        run: () => chain().toggleItalic().run(),
      },
      {
        label: 'Strikethrough',
        icon: IconStrikethrough,
        isActive: state.strike,
        run: () => chain().toggleStrike().run(),
      },
      {
        label: 'Inline code',
        icon: IconCode,
        isActive: state.code,
        run: () => chain().toggleCode().run(),
      },
    ],
    [
      {
        label: 'Heading 1',
        icon: IconH1,
        isActive: state.h1,
        run: () => chain().toggleHeading({ level: 1 }).run(),
      },
      {
        label: 'Heading 2',
        icon: IconH2,
        isActive: state.h2,
        run: () => chain().toggleHeading({ level: 2 }).run(),
      },
    ],
    [
      {
        label: 'Bullet list',
        icon: IconList,
        isActive: state.bulletList,
        run: () => chain().toggleBulletList().run(),
      },
      {
        label: 'Numbered list',
        icon: IconListNumbers,
        isActive: state.orderedList,
        run: () => chain().toggleOrderedList().run(),
      },
      {
        label: 'Checklist',
        icon: IconListCheck,
        isActive: state.taskList,
        run: () => chain().toggleTaskList().run(),
      },
    ],
    [
      {
        label: 'Quote',
        icon: IconBlockquote,
        isActive: state.blockquote,
        run: () => chain().toggleBlockquote().run(),
      },
      {
        label: 'Code block',
        icon: IconSourceCode,
        isActive: state.codeBlock,
        run: () => chain().toggleCodeBlock().run(),
      },
    ],
    [
      {
        label: 'Undo (⌘Z)',
        icon: IconArrowBackUp,
        run: () => chain().undo().run(),
        disabled: !state.canUndo,
      },
      {
        label: 'Redo (⌘⇧Z)',
        icon: IconArrowForwardUp,
        run: () => chain().redo().run(),
        disabled: !state.canRedo,
      },
    ],
  ];

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="border-gray-2 flex shrink-0 flex-wrap items-center gap-y-1 border-b px-2 py-1.5"
    >
      {groups.map((tools, index) => (
        <div key={index} className="border-gray-2 flex items-center px-1 not-first:border-l">
          {tools.map(({ label, icon: ToolIcon, isActive, run, disabled }) => (
            <IconButton
              key={label}
              label={label}
              pressed={isActive}
              disabled={disabled}
              onClick={run}
            >
              <ToolIcon aria-hidden size={18} stroke={1.5} />
            </IconButton>
          ))}
        </div>
      ))}
      <div className="ml-auto pl-1">
        <IconButton label="Copy as Markdown" onClick={onCopy}>
          <IconCopy aria-hidden size={18} stroke={1.5} />
        </IconButton>
      </div>
    </div>
  );
}
