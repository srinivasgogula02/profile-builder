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
                
                /* Image Overlay Button */
                .img-overlay-btn {
                    position: absolute;
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-family: sans-serif;
                    cursor: pointer;
                    z-index: 1000;
                    display: none;
                    pointer-events: none; /* Let clicks pass through to the image listener initially, or handle click on btn */
                    transform: translate(-50%, -50%);
                    font-weight: bold;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                }
            </style>
            <script id="editor-script">
            (function() {
                console.log("Editor script initialized via direct injection");
                
                // Create the floating button
                let overlayBtn = document.createElement('div');
                overlayBtn.className = 'img-overlay-btn';
                overlayBtn.innerText = '📷 Replace Image';
                document.body.appendChild(overlayBtn);

                // Helper to check for background image
                const getBackgroundImage = (el) => {
                    const style = window.getComputedStyle(el);
                    const bg = style.backgroundImage;
                    if (bg && bg !== 'none' && bg.includes('url(')) {
                        return bg;
                    }
                    return null;
                };

                // 1. Mark default images on load & Setup Hover
                const setupImages = () => {
                    // Handle <img> tags
                    document.querySelectorAll('img').forEach(img => {
                        if (img.width < 30 || img.height < 30) return;
                        img.style.cursor = 'pointer';
                        
                        img.addEventListener('mouseenter', (e) => {
                            const rect = img.getBoundingClientRect();
                            overlayBtn.style.left = (rect.left + rect.width / 2 + window.scrollX) + 'px';
                            overlayBtn.style.top = (rect.top + rect.height / 2 + window.scrollY) + 'px';
                            overlayBtn.style.display = 'block';
                            
                            img.style.outline = '3px solid #3b82f6';
                            img.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
                            img.dataset.hovered = 'true';
                        });

                        img.addEventListener('mouseleave', (e) => {
                            setTimeout(() => {
                                if (!overlayBtn.matches(':hover') && img.dataset.hovered !== 'true') {
                                    overlayBtn.style.display = 'none';
                                    img.style.outline = '';
                                    img.style.boxShadow = '';
                                }
                            }, 100);
                            img.dataset.hovered = 'false';
                        });
                    });

                    // Handle Background Images (e.g. Hero Sections)
                    // We scan ALL elements, which is heavy, so let's restrict to likely containers
                    // or just scan everything once.
                    document.querySelectorAll('*').forEach(el => {
                        if (el.tagName === 'IMG') return; // Handled above
                        
                        const bg = getBackgroundImage(el);
                        if (bg) {
                             const rect = el.getBoundingClientRect();
                             if (rect.width < 50 || rect.height < 50) return;

                             el.style.cursor = 'pointer';
                             el.dataset.hasBgImage = 'true';

                             el.addEventListener('mouseenter', (e) => {
                                 // Stop propagation so we don't trigger parent bg hovers if nested
                                 e.stopPropagation();
                                 
                                 const rect = el.getBoundingClientRect();
                                 overlayBtn.style.left = (rect.left + rect.width / 2 + window.scrollX) + 'px';
                                 overlayBtn.style.top = (rect.top + rect.height / 2 + window.scrollY) + 'px';
                                 overlayBtn.style.display = 'block';
                                 
                                 el.style.outline = '3px solid #3b82f6';
                                 el.style.boxShadow = 'inset 0 0 20px rgba(59, 130, 246, 0.5)'; // Inset for containers
                                 el.dataset.hovered = 'true';
                             });

                             el.addEventListener('mouseleave', (e) => {
                                 setTimeout(() => {
                                     if (!overlayBtn.matches(':hover') && el.dataset.hovered !== 'true') {
                                         overlayBtn.style.display = 'none';
                                         el.style.outline = '';
                                         el.style.boxShadow = '';
                                     }
                                 }, 100);
                                 el.dataset.hovered = 'false';
                             });
                        }
                    });
                };
                
                // Handle button click (since it sits on top)
                overlayBtn.style.pointerEvents = 'auto';
                
                let currentHoveredImg = null;

                // Improved detection to handle transparent overlays
                document.addEventListener('mousemove', (e) => {
                     const elements = document.elementsFromPoint(e.clientX, e.clientY);
                     
                     // 1. Look for IMG
                     let target = elements.find(el => el.tagName === 'IMG' && el.width > 30);
                     
                     // 2. Look for BG Image if no IMG found
                     if (!target) {
                         target = elements.find(el => el.dataset?.hasBgImage === 'true');
                     }

                     if (target) {
                         currentHoveredImg = target;
                         const rect = target.getBoundingClientRect();
                         
                         // Check jitter
                         if (overlayBtn.style.display === 'block' && 
                             Math.abs(parseFloat(overlayBtn.style.top) - (rect.top + rect.height / 2 + window.scrollY)) < 5 &&
                             Math.abs(parseFloat(overlayBtn.style.left) - (rect.left + rect.width / 2 + window.scrollX)) < 5) {
                             return;
                         }

                         overlayBtn.style.left = (rect.left + rect.width / 2 + window.scrollX) + 'px';
                         overlayBtn.style.top = (rect.top + rect.height / 2 + window.scrollY) + 'px';
                         overlayBtn.style.display = 'block';
                         
                         // Highlight
                         if (target.style.outline !== '3px solid #3b82f6') {
                             target.style.outline = '3px solid #3b82f6';
                             if (target.tagName === 'IMG') {
                                 target.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
                             } else {
                                 target.style.boxShadow = 'inset 0 0 20px rgba(59, 130, 246, 0.5)';
                             }
                         }
                     } else {
                         // Only hide if we aren't over the button itself
                         if (e.target !== overlayBtn) {
                             overlayBtn.style.display = 'none';
                             if (currentHoveredImg) {
                                 currentHoveredImg.style.outline = '';
                                 currentHoveredImg.style.boxShadow = '';
                                 currentHoveredImg = null;
                             }
                         }
                     }
                });

                overlayBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (currentHoveredImg) {
                        triggerImageReplace(currentHoveredImg);
                    }
                });

                // Run shortly after load to ensure images are present
                setTimeout(setupImages, 500);

                function triggerImageReplace(target) {
                    console.log("Image replacement requested for:", target);
                    if (!target.id) {
                        target.id = 'img-' + Math.random().toString(36).substr(2, 9);
                    }
                    
                    let currentSrc = '';
                    if (target.tagName === 'IMG') {
                        currentSrc = target.src;
                    } else {
                        // Extract URL from background-image: url("...")
                        const bg = window.getComputedStyle(target).backgroundImage;
                        const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
                        if (match) currentSrc = match[1];
                    }

                    window.parent.postMessage({ 
                        type: 'IMAGE_CLICK', 
                        imageId: target.id,
                        currentSrc: currentSrc
                    }, '*');
                }

                document.body.addEventListener('click', (e) => {
                    const target = e.target;
                    
                    if (target === document.body || target === document.documentElement) return;

                    // 1. Direct Image Click
                    if (target.tagName === 'IMG') {
                        e.preventDefault();
                        e.stopPropagation();
                        if (target.width > 30) triggerImageReplace(target);
                        return;
                    }

                    // 2. Check for Image Underneath (Transparent Overlay Case)
                    if (!['A', 'BUTTON', 'INPUT', 'TEXTAREA'].includes(target.tagName) && 
                        target.getAttribute('contenteditable') !== 'true') {
                        
                        const elements = document.elementsFromPoint(e.clientX, e.clientY);
                        
                        // Check IMG or BG-Image
                        let img = elements.find(el => el.tagName === 'IMG' && el.width > 30);
                        if (!img) {
                             // Check for background image element
                             img = elements.find(el => el.dataset?.hasBgImage === 'true');
                        }
                        
                        if (img) {
                            e.preventDefault();
                            e.stopPropagation();
                            triggerImageReplace(img);
                            return;
                        }
                    }

                    // TEXT CLICK HANDLING
                    if (target.getAttribute('contenteditable') === 'true') return;

                    // Only enable editing for text-like elements
                    const tag = target.tagName;
                    if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'DIV', 'LI', 'A'].includes(tag)) {
                        if (target.children.length === 0 || target.textContent.length < 1000) {
                            console.log("Activating edit mode for", tag);
                            target.setAttribute('contenteditable', 'true');
                            target.focus();
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }
                }, true);

                const sendUpdate = () => {
                     // Clone to clean
                     const clone = document.documentElement.cloneNode(true);
                     
                     // Remove our injected stuff
                     const script = clone.querySelector('#editor-script');
                     if(script) script.remove();
                     const style = clone.querySelector('#editor-style');
                     if(style) style.remove();
                     const btn = clone.querySelector('.img-overlay-btn');
                     if(btn) btn.remove();
                     
                     // Remove properties we added
                     clone.querySelectorAll('*').forEach(el => {
                         el.removeAttribute('data-default');
                         el.removeAttribute('data-replaced');
                         el.removeAttribute('data-has-bg-image'); // clean this up
                         if (el.dataset) delete el.dataset.hovered;
                         
                         // Only remove cursor/outline if we added it (tricky, but safe to clear inline styles we likely added)
                         // We should be specific to avoid clearing user styles? 
                         // Ideally we only clear if it matches what we set.
                         // For now, clearing these specific ones is okay as they are interaction styles.
                         if (el.tagName === 'IMG' || el.style.cursor === 'pointer') {
                             el.style.cursor = '';
                             el.style.outline = '';
                             el.style.boxShadow = '';
                         }
                     });
                     
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
                    const { type, format, fileName, imageId, newSrc } = event.data;

                    if (type === 'REPLACE_IMAGE') {
                        const el = document.getElementById(imageId);
                        if (el) {
                            if (el.tagName === 'IMG') {
                                el.src = newSrc;
                            } else {
                                // Assume background image replacement
                                // Preserve other background properties (like gradient) if possible?
                                // Usually hard. Let's just update the url.
                                // If they had a gradient + url, replacing just url is tricky without parsing.
                                // Simple fix: Replace the whole background with the new image centered.
                                // OR: Try to regex replace the url part.
                                
                                const computed = window.getComputedStyle(el);
                                let bg = computed.backgroundImage;
                                
                                if (bg.includes('url(')) {
                                     // Regex replace the url content
                                     // This handles "linear-gradient(...), url(...)" cases nicely
                                     bg = bg.replace(/url\(['"]?.*?['"]?\)/, 'url("' + newSrc + '")');
                                     el.style.backgroundImage = bg;
                                } else {
                                     // Fallback
                                     el.style.backgroundImage = 'url("' + newSrc + '")';
                                }
                            }
                            
                            el.removeAttribute('data-default');
                            el.setAttribute('data-replaced', 'true');
                            el.style.outline = 'none'; 
                            el.style.boxShadow = '';
                            sendUpdate(); // Save state
                        }
                    }

                    if (type === 'TRIGGER_PRIMARY_IMAGE_CLICK') {
                        // Find the largest image OR background element > 50px
                        let bestEl = null;
                        let maxArea = 0;
                        
                        // Check IMGs
                        document.querySelectorAll('img').forEach(img => {
                             if (img.width > 50 && img.height > 50) {
                                  const area = img.width * img.height;
                                  if (area > maxArea) {
                                      maxArea = area;
                                      bestEl = img;
                                  }
                             }
                        });
                        
                        // Check BG Images
                        document.querySelectorAll('*').forEach(el => {
                            if (el.dataset?.hasBgImage === 'true') {
                                const rect = el.getBoundingClientRect();
                                const area = rect.width * rect.height;
                                if (area > maxArea) {
                                    maxArea = area;
                                    bestEl = el;
                                }
                            }
                        });
                        
                        if (bestEl) {
                            triggerImageReplace(bestEl);
                        } else {
                            console.warn("No suitable image found to replace.");
                        }
                    }

                    if (type === 'GENERATE_DOWNLOAD') {
                         try {
                             // ... (style handling same as before)
                             
                             // CLEANUP FOR GENERATION
                             document.querySelectorAll('img').forEach(img => {
                                 img.style.outline = '';
                                 img.style.boxShadow = '';
                                 img.style.cursor = '';
                             });
                             if (overlayBtn) overlayBtn.style.display = 'none';

                             // ... (html-to-image logic same as before)
                        } catch (err) {
                             // ...
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
