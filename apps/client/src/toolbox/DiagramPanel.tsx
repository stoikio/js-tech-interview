import { Excalidraw, FONT_FAMILY } from '@excalidraw/excalidraw';
import type { ExcalidrawProps } from '@excalidraw/excalidraw/types';

import '@excalidraw/excalidraw/index.css';
import { useEffect, useRef, useState } from 'react';

import { load, save } from './storage';

const STORAGE_KEY = 'stoik-lite.toolbox.diagram';

declare global {
  interface Window {
    /** Where Excalidraw loads its fonts from. */
    EXCALIDRAW_ASSET_PATH?: string | string[];
  }
}

// Fonts are served by the app (copied by scripts/copy-excalidraw-fonts.mjs), not by a CDN.
window.EXCALIDRAW_ASSET_PATH = `${window.location.origin}/excalidraw-assets/`;

type Scene = Parameters<NonNullable<ExcalidrawProps['onChange']>>;
type StoredDiagram = { elements: Scene[0]; files: Scene[2] };

/** Excalidraw whiteboard: shapes, arrows, text, frames, libraries, export to PNG or SVG. */
export function DiagramPanel() {
  const [stored] = useState(() => load<StoredDiagram>(STORAGE_KEY));
  const saveTimer = useRef<number | undefined>(undefined);
  const pendingSave = useRef<(() => void) | null>(null);

  // Closing the panel right after a change still saves it.
  useEffect(
    () => () => {
      window.clearTimeout(saveTimer.current);
      pendingSave.current?.();
    },
    [],
  );

  // Excalidraw registers its fonts shortly after mounting, and loads one only when a text uses it.
  // Load the default font right away: a text measured with a fallback font gets clipped.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (![...document.fonts].some((font) => font.family === 'Nunito')) return;
      window.clearInterval(timer);
      void document.fonts.load('20px Nunito', 'Aa');
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  // Excalidraw reports every pointer move: save at most twice a second.
  const onChange: ExcalidrawProps['onChange'] = (elements, _appState, files) => {
    pendingSave.current = () => {
      pendingSave.current = null;
      save(STORAGE_KEY, { elements: elements.filter((element) => !element.isDeleted), files });
    };
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => pendingSave.current?.(), 500);
  };

  return (
    <div className="min-h-0 flex-1">
      <Excalidraw
        initialData={{
          elements: stored?.elements ?? [],
          files: stored?.files,
          // Clean by default: Nunito ("Normal" in the font picker) and straight lines ("Architect"
          // sloppiness). Both can be changed per element in Excalidraw's properties panel.
          appState: {
            viewBackgroundColor: '#ffffff',
            currentItemFontFamily: FONT_FAMILY.Nunito,
            currentItemRoughness: 0,
          },
          scrollToContent: true,
        }}
        onChange={onChange}
        UIOptions={{ canvasActions: { toggleTheme: false, saveToActiveFile: false } }}
      />
    </div>
  );
}
