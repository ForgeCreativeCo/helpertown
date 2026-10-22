/// <reference types="vite/client" />

declare module 'virtual:asset-manifest' {
  const manifest: {
    /** Bundled real recordings, `public/audio/recorded/<id>.<ext>`. */
    recorded: Record<string, string>;
    /** Bundled generated voice files, `public/audio/generated/<id>.<ext>`. */
    generated: Record<string, string>;
    /** Bundled family photos, `public/family/<id>.<ext>`. */
    family: Record<string, string>;
  };
  export default manifest;
}
