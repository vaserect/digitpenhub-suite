'use client';

import { useEffect, useRef } from 'react';

// Isolated Fabric.js canvas — deliberately self-contained and opt-in (see the
// "Pro Canvas (beta)" toggle in the Graphic Design Editor module) rather than
// replacing the existing hand-rolled div-based editor in place. Swapping the
// rendering engine for every Creative tool in one pass, in a file this size,
// with no way to browser-test the result, was judged too risky to do blindly
// — this lets the new engine ship for one tool without touching the old one.
//
// `width`/`height`/`background`/`initialJSON` are only read once, at mount —
// pass a `key` prop from the parent to force a remount when canvas size
// changes (see how the Graphic Design Editor module does this).
export default function FabricCanvasEditor({ width = 800, height = 600, background = '#ffffff', initialJSON, onReady }) {
  const canvasElRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let canvas;

    import('fabric').then(({ Canvas, IText, Rect, Circle, FabricImage }) => {
      if (disposed || !canvasElRef.current) return;
      canvas = new Canvas(canvasElRef.current, { width, height, backgroundColor: background });

      const api = {
        addText: () => {
          const obj = new IText('Your text', { left: 60, top: 60, fontSize: 28, fill: '#111111' });
          canvas.add(obj);
          canvas.setActiveObject(obj);
        },
        addRect: () => {
          const obj = new Rect({ left: 60, top: 60, width: 140, height: 90, fill: '#2563eb' });
          canvas.add(obj);
          canvas.setActiveObject(obj);
        },
        addCircle: () => {
          const obj = new Circle({ left: 60, top: 60, radius: 50, fill: '#16a34a' });
          canvas.add(obj);
          canvas.setActiveObject(obj);
        },
        addImage: async (url) => {
          if (!url) return;
          try {
            const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
            img.scaleToWidth(200);
            canvas.add(img);
            canvas.setActiveObject(img);
          } catch {
            // Bad URL or CORS-blocked host — silently no-op, matches the
            // classic editor's behavior of just not rendering a broken image.
          }
        },
        setFill: (color) => {
          const obj = canvas.getActiveObject();
          if (!obj) return;
          obj.set('fill', color);
          canvas.requestRenderAll();
        },
        bringForward: () => { const o = canvas.getActiveObject(); if (o) canvas.bringObjectForward(o); },
        sendBackward: () => { const o = canvas.getActiveObject(); if (o) canvas.sendObjectBackwards(o); },
        deleteSelected: () => {
          canvas.getActiveObjects().forEach((o) => canvas.remove(o));
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        },
        clear: () => {
          canvas.clear();
          canvas.backgroundColor = background;
          canvas.requestRenderAll();
        },
        exportPNG: () => canvas.toDataURL({ format: 'png', multiplier: 2 }),
        getJSON: () => canvas.toJSON(),
      };

      if (initialJSON) {
        canvas.loadFromJSON(initialJSON).then(() => canvas.requestRenderAll());
      }

      onReady?.(api);
    });

    return () => {
      disposed = true;
      if (canvas) canvas.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasElRef} style={{ border: '1px solid var(--border)', borderRadius: 8, maxWidth: '100%' }} />;
}
