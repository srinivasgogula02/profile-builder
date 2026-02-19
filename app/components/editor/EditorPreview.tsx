'use client';

import React, { useEffect, useRef, useState } from 'react';
import Handlebars from 'handlebars';

interface EditorPreviewProps {
    html: string;
    data: any;
    onHtmlChange: (newHtml: string) => void;
    width?: number; // Base width (e.g., 794 for A4)
    height?: number; // Base height (e.g., 1123 for A4)
}

export default function EditorPreview({ html, data, onHtmlChange, width = 794, height = 1123 }: EditorPreviewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [compiledHtml, setCompiledHtml] = useState('');
    const lastEmittedHtml = useRef('');

    // Compile template when HTML or data changes
    useEffect(() => {
        try {
            if (!html) return;

            // If the incoming HTML matches what we just emitted from the iframe, 
            // skip re-compilation to prevent re-rendering and losing focus.
            if (html === lastEmittedHtml.current) {
                return;
            }

            const template = Handlebars.compile(html);
            const result = template(data);
            setCompiledHtml(result);
        } catch (e) {
            console.error("Handlebars compilation error:", e);
        }
    }, [html, data]);

    // Update iframe content
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        // Skip if no content to render (avoids accessing null body on initial empty state)
        if (!compiledHtml) return;

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        // Editor script as a string to inject directly
        const editorScript = `
            <style id="editor-style">
                [contenteditable="true"] { outline: 1px dashed rgba(0,0,0,0.1); cursor: text; }
                [contenteditable="true"]:focus { outline: 2px solid #3b82f6; background-color: rgba(59, 130, 246, 0.05); }
            </style>
            <script id="editor-script">
            (function() {
                console.log("Editor script initialized via direct injection");
                
                document.body.addEventListener('click', (e) => {
                    const target = e.target;
                    
                    if (target === document.body || target === document.documentElement) return;
                    if (target.getAttribute('contenteditable') === 'true') return;

                    console.log("Activating edit mode for", target.tagName);
                    target.setAttribute('contenteditable', 'true');
                    target.focus();
                    
                    e.preventDefault();
                    e.stopPropagation();
                }, true);

                const sendUpdate = () => {
                     // Clone to clean
                     const clone = document.documentElement.cloneNode(true);
                     
                     // Remove our injected stuff
                     const script = clone.querySelector('#editor-script');
                     if(script) script.remove();
                     const style = clone.querySelector('#editor-style');
                     if(style) style.remove();
                     
                     // Remove html-to-image script if it exists
                     const hti = clone.querySelector('script[src*="html-to-image"]');
                     if(hti) hti.remove();

                     window.parent.postMessage({ type: 'HTML_UPDATE', html: clone.outerHTML }, '*');
                };

                document.body.addEventListener('input', (e) => {
                     sendUpdate();
                });
                
                document.querySelectorAll('a').forEach(a => {
                    a.addEventListener('click', (e) => e.preventDefault());
                });

                window.addEventListener('message', async (event) => {
                    const { type, format, fileName } = event.data;
                    if (type === 'GENERATE_DOWNLOAD') {
                        try {
                             const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
                             let combinedCss = '';
                             
                             await Promise.all(links.map(async (link) => {
                                  try {
                                      if (link.href && link.href.startsWith('http')) {
                                          const res = await fetch(link.href);
                                          if(res.ok) {
                                              combinedCss += await res.text();
                                              combinedCss += '\\n';
                                          }
                                      }
                                  } catch(e) { console.warn("Style fetch error", e); }
                             }));
                             
                             document.querySelectorAll('style').forEach(s => {
                                 if (s.id !== 'editor-style') combinedCss += s.textContent + '\\n';
                             });

                             const editorStyle = document.getElementById('editor-style');
                             if(editorStyle) editorStyle.remove();
                             
                             document.head.innerHTML = '';
                             const style = document.createElement('style');
                             style.textContent = combinedCss;
                             document.head.appendChild(style);
                             
                             if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

                             if (format === 'png' || format === 'pdf') {
                                 if (!window.htmlToImage) throw new Error("html-to-image not loaded");
                                 const dataUrl = await window.htmlToImage.toPng(document.body, { 
                                     quality: 1.0, pixelRatio: 2, skipFonts: true, skipOnError: true 
                                 });
                                 window.parent.postMessage({ type: 'DOWNLOAD_READY', format, dataUrl, fileName }, '*');
                             }
                        } catch (err) {
                             console.error("Generation failed", err);
                             window.parent.postMessage({ type: 'DOWNLOAD_ERROR', error: String(err) }, '*');
                        }
                    }
                });
            })();
            </script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js"></script>
        `;

        let finalHtml = compiledHtml;
        if (finalHtml.includes('</body>')) {
            finalHtml = finalHtml.replace('</body>', editorScript + '</body>');
        } else {
            finalHtml += editorScript;
        }

        doc.open();
        doc.write(finalHtml);
        doc.close();

    }, [compiledHtml]);

    // Listen for messages from iframe
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data.type === 'HTML_UPDATE') {
                // cache the value we are about to send up
                lastEmittedHtml.current = event.data.html;
                onHtmlChange(event.data.html);
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [onHtmlChange]);

    // Scaling logic
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const calculateScale = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;

            // Add padding (48px = 24px each side/top/bottom) to create "canvas" feel
            const paddingX = 48;
            const paddingY = 48;

            const availableWidth = containerWidth - paddingX;
            // We mainly care about width fit, but check height if it's very tall? 
            // Standard behavior is usually "Fit Width" for doc editors.

            const scaleX = availableWidth / width;

            // Limit max scale to avoid pixelation, allowing zoom up to 120% if space permits
            const newScale = Math.min(scaleX, 1.2);
            setScale(newScale);
        };

        const observer = new ResizeObserver(calculateScale);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        calculateScale();
        window.addEventListener('resize', calculateScale); // Fallback

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', calculateScale);
        };
    }, [width, height]);

    return (
        <div ref={containerRef} className="w-full h-full bg-slate-200/50 flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden pt-8 pb-12">
            <div
                className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-slate-900/5 origin-top transition-transform duration-200 ease-out shrink-0"
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    transform: `scale(${scale})`,
                    // The scaled element occupies scale * height visual space. 
                    // We need to adjust margin bottom to reduce whitespace if scale < 1, 
                    // or ensure scroll space if scale > 1 (though we capped at 1.2).
                    // Actually, with Flex column and shrink-0, we just need to set the marginBottom relative to the scaled size difference.
                    marginBottom: `${(height * scale) - height}px`,
                    // We might need a small top margin to ensure it's not sticking to top if zoomed in?
                    // The parent pt-8 handles the top spec.
                }}
            >
                <iframe
                    ref={iframeRef}
                    id="template-preview-iframe"
                    className="w-full h-full block"
                    title="Template Preview"
                    sandbox="allow-scripts allow-same-origin"
                />
            </div>
        </div>
    );
}
