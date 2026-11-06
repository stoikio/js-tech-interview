import { Menu as BaseMenu } from '@base-ui/react/menu';
import {
  IconApi,
  IconDatabase,
  IconNotes,
  IconRestore,
  IconTools,
  IconVectorBezier2,
  type Icon,
} from '@tabler/icons-react';
import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';

import { PageLoader } from '../ui/Loader';
import { ToolPanel } from './ToolPanel';

type Tool = {
  title: string;
  icon: Icon;
  group: 'Write and draw' | 'Explore the app' | 'Development';
  layout: 'sheet' | 'full' | 'card';
  /** Opened and closed with Alt (⌥) and this key. */
  key: string;
  /** Loaded on first use: most tools are heavy and most pages never need them. */
  Panel: ComponentType;
  devOnly?: boolean;
};

const allTools: Tool[] = [
  {
    title: 'Notes',
    icon: IconNotes,
    group: 'Write and draw',
    layout: 'sheet',
    key: 'N',
    Panel: lazy(() => import('./NotesPanel').then((m) => ({ default: m.NotesPanel }))),
  },
  {
    title: 'Diagram',
    icon: IconVectorBezier2,
    group: 'Write and draw',
    layout: 'full',
    key: 'D',
    Panel: lazy(() => import('./DiagramPanel').then((m) => ({ default: m.DiagramPanel }))),
  },
  {
    title: 'Data model',
    icon: IconDatabase,
    group: 'Explore the app',
    layout: 'full',
    key: 'M',
    Panel: lazy(() => import('./DataModelPanel').then((m) => ({ default: m.DataModelPanel }))),
  },
  {
    title: 'API explorer',
    icon: IconApi,
    group: 'Explore the app',
    layout: 'full',
    key: 'A',
    Panel: lazy(() => import('./ApiExplorerPanel').then((m) => ({ default: m.ApiExplorerPanel }))),
  },
  {
    title: 'Reset',
    icon: IconRestore,
    group: 'Development',
    layout: 'card',
    key: 'R',
    Panel: lazy(() => import('./ResetPanel').then((m) => ({ default: m.ResetPanel }))),
    devOnly: true,
  },
];

const tools = allTools.filter((tool) => !tool.devOnly || import.meta.env.DEV);
const groups = [...new Set(tools.map((tool) => tool.group))];

const CLOSES_ON_ESCAPE_FIRST = [
  // The app's dialogs, menus and selects. Excalidraw's properties panel also uses these roles,
  // for parts that are always visible.
  '[role="dialog"]:not(.excalidraw *)',
  '[role="menu"]:not(.excalidraw *)',
  '[role="listbox"]',
  // Excalidraw's text editor, popovers, menus and dialogs.
  'textarea.excalidraw-wysiwyg',
  '[data-radix-popper-content-wrapper]',
  '.excalidraw .dropdown-menu',
  '.excalidraw .context-menu',
  '.excalidraw .Modal',
].join(', ');

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
const shortcutLabel = (key: string) => (isMac ? `⌥${key}` : `Alt+${key}`);

/** Floating toolbox to take notes, draw and explore the app while discussing it. */
export function Toolbox() {
  const [open, setOpen] = useState<Tool | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return;
      // `code` and not `key`: on macOS, ⌥N types "˜".
      const tool = tools.find((t) => event.code === `Key${t.key}`);
      if (!tool) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen((current) => (current === tool ? null : tool));
    }
    // Capture phase: the shortcuts work even when Excalidraw or an editor has the focus.
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      // Escape first closes what is open on top of the panel (a menu, a dialog, Excalidraw's text
      // editor), the next one closes the panel. Checked before those handle the key.
      if (event.key !== 'Escape' || document.querySelector(CLOSES_ON_ESCAPE_FIRST)) return;
      setOpen(null);
    }
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open]);

  if (open) {
    return (
      <ToolPanel
        title={open.title}
        icon={open.icon}
        layout={open.layout}
        shortcut={shortcutLabel(open.key)}
        onClose={() => setOpen(null)}
      >
        <Suspense fallback={<PageLoader />}>
          <open.Panel />
        </Suspense>
      </ToolPanel>
    );
  }

  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        openOnHover
        delay={0}
        closeDelay={150}
        aria-label="Toolbox"
        className="bg-gray-9 fixed right-4 bottom-4 z-50 flex size-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 data-[popup-open]:scale-105"
      >
        <IconTools aria-hidden size={22} stroke={1.5} />
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner side="top" align="end" sideOffset={8} className="z-50 outline-none">
          <BaseMenu.Popup className="border-gray-2 min-w-56 origin-(--transform-origin) rounded-md border bg-white p-1 shadow-md transition-[opacity,scale] duration-100 outline-none data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {groups.map((group) => (
              <BaseMenu.Group
                key={group}
                className="not-first:border-gray-2 not-first:mt-1 not-first:border-t not-first:pt-1"
              >
                <BaseMenu.GroupLabel className="text-gray px-2 py-1.5 text-xs font-medium">
                  {group}
                </BaseMenu.GroupLabel>
                {tools
                  .filter((tool) => tool.group === group)
                  .map((tool) => (
                    <BaseMenu.Item
                      key={tool.title}
                      onClick={() => setOpen(tool)}
                      className="data-[highlighted]:bg-gray-1 flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
                    >
                      <tool.icon aria-hidden size={16} stroke={1.5} />
                      {tool.title}
                      <kbd className="text-gray-6 ml-auto pl-4 font-sans text-xs">
                        {shortcutLabel(tool.key)}
                      </kbd>
                    </BaseMenu.Item>
                  ))}
              </BaseMenu.Group>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
