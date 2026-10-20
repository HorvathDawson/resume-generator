import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { sharedLinkFromUrl } from './model/io';

// The embed view (?mode=embed) only needs the resume renderer, so the editor
// is a separate chunk. Rendering waits for the module, so the intro text in
// index.html stays up until there's something to replace it with.
const shared = sharedLinkFromUrl(window.location.search);

async function start() {
  const root = createRoot(document.getElementById('root')!);
  if (shared?.embed) {
    const { Embed } = await import('./embed/Embed');
    root.render(<StrictMode><Embed url={shared.url} /></StrictMode>);
  } else {
    const { default: App } = await import('./App');
    root.render(<StrictMode><App /></StrictMode>);
  }
}

start();
