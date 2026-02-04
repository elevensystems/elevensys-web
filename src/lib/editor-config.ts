/**
 * Shared Monaco Editor configuration
 *
 * Types are inferred from the editor component, avoiding direct monaco-editor dependency
 */

/** Default options for Monaco Editor instances */
export const MONACO_DEFAULT_OPTIONS = {
  minimap: { enabled: false },
  lineNumbers: 'on' as const,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  padding: { top: 12, bottom: 12 },
};

/** Extended options for JSON editing with auto-format */
export const MONACO_JSON_OPTIONS = {
  ...MONACO_DEFAULT_OPTIONS,
  formatOnPaste: true,
  formatOnType: true,
};

/** Options for read-only output editors */
export const MONACO_READONLY_OPTIONS = {
  ...MONACO_DEFAULT_OPTIONS,
  readOnly: true,
};
