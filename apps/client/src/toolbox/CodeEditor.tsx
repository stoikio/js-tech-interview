import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import { linter, lintGutter } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder as placeholderText,
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { useEffect, useRef } from 'react';

type Props = {
  value: string;
  onChange?: (value: string) => void;
  /** Mod-Enter (⌘↵ or Ctrl+Enter) inside the editor. */
  onSubmit?: () => void;
  readOnly?: boolean;
  /** Wraps long lines instead of scrolling sideways. */
  lineWrapping?: boolean;
  placeholder?: string;
  label: string;
};

/** JSON editor with line numbers, folding, bracket matching and syntax errors in the gutter. */
export function CodeEditor(props: Props) {
  const { value, onChange, onSubmit, readOnly, lineWrapping, placeholder, label } = props;
  const parent = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  // The editor is created once: it reads the latest callbacks through this ref.
  const callbacks = useRef({ onChange, onSubmit });
  useEffect(() => {
    callbacks.current = { onChange, onSubmit };
  });

  useEffect(() => {
    if (!parent.current) return;
    const editor = new EditorView({
      parent: parent.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          foldGutter({ openText: '▾', closedText: '▸' }),
          json(),
          syntaxHighlighting(jsonHighlight),
          bracketMatching(),
          theme,
          EditorView.contentAttributes.of({ 'aria-label': label }),
          EditorState.readOnly.of(Boolean(readOnly)),
          ...(lineWrapping ? [EditorView.lineWrapping] : []),
          ...(readOnly
            ? []
            : [
                history(),
                closeBrackets(),
                indentOnInput(),
                highlightActiveLine(),
                highlightActiveLineGutter(),
                lintGutter(),
                linter(jsonParseLinter(), { delay: 300 }),
                placeholderText(placeholder ?? ''),
                keymap.of([
                  {
                    key: 'Mod-Enter',
                    run: () => {
                      callbacks.current.onSubmit?.();
                      return true;
                    },
                  },
                  ...closeBracketsKeymap,
                  ...defaultKeymap,
                  ...historyKeymap,
                  ...foldKeymap,
                  indentWithTab,
                ]),
                EditorView.updateListener.of((update) => {
                  if (update.docChanged) callbacks.current.onChange?.(update.state.doc.toString());
                }),
              ]),
        ],
      }),
    });
    view.current = editor;
    return () => editor.destroy();
    // The value is synced by the next effect; the other props never change for a mounted editor.
    // oxlint-disable-next-line react/exhaustive-deps
  }, []);

  // Replace the content when it changes from outside (a new response, "Reset").
  useEffect(() => {
    const editor = view.current;
    if (!editor || editor.state.doc.toString() === value) return;
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
  }, [value]);

  return <div ref={parent} className="flex min-h-0 flex-1 flex-col" />;
}

const theme = EditorView.theme({
  '&': {
    flex: '1',
    minHeight: '0',
    fontSize: '12.5px',
    backgroundColor: 'var(--color-white)',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    lineHeight: '20px',
  },
  '.cm-content': { padding: '10px 0', caretColor: 'var(--color-blue)' },
  '.cm-line': { padding: '0 16px 0 8px' },
  '.cm-gutters': {
    backgroundColor: 'var(--color-white)',
    color: 'var(--color-gray-5)',
    border: 'none',
  },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 4px 0 16px', minWidth: '36px' },
  '.cm-foldGutter .cm-gutterElement': { color: 'var(--color-gray-5)', cursor: 'pointer' },
  '.cm-activeLine': { backgroundColor: 'var(--color-gray-0)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--color-gray-0)', color: 'var(--color-gray-8)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--color-blue-1) !important',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'var(--color-blue-0)',
    outline: '1px solid var(--color-blue-1)',
  },
  '.cm-placeholder': { color: 'var(--color-gray-5)' },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--color-gray-1)',
    border: 'none',
    color: 'var(--color-gray-7)',
    padding: '0 4px',
  },
  '.cm-tooltip': {
    border: '1px solid var(--color-gray-2)',
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
    backgroundColor: 'var(--color-white)',
  },
  '.cm-diagnostic-error': { borderLeft: '3px solid var(--color-red-5)' },
});

const jsonHighlight = HighlightStyle.define([
  { tag: tags.propertyName, color: 'var(--color-blue-6)' },
  { tag: tags.string, color: 'var(--color-green-7)' },
  { tag: tags.number, color: 'var(--color-orange-7)' },
  { tag: [tags.bool, tags.null], color: 'var(--color-cyan-7)' },
  {
    tag: [tags.separator, tags.punctuation, tags.brace, tags.squareBracket],
    color: 'var(--color-gray-6)',
  },
]);
