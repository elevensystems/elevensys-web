'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import Editor from '@monaco-editor/react';
import {
  Copy,
  Eraser,
  FileCode2,
  Minimize2,
  ScanSearch,
  TextInitial,
} from 'lucide-react';
import type * as Monaco from 'monaco-editor';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import MainLayout from '@/components/layouts/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DEFAULT_JSON = `{
  "name": "John Doe",
  "age": 30,
  "isActive": true,
  "roles": ["admin", "user"],
  "metadata": {
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLogin": null
  }
}`;

type IndentSize = '2' | '4' | 'tab';

const parseJsonSafely = (value: string) => {
  try {
    return {
      value: JSON.parse(value) as unknown,
      error: '',
      isValid: true,
    };
  } catch (error) {
    return {
      value: null as unknown,
      error: error instanceof Error ? error.message : 'Invalid JSON',
      isValid: false,
    };
  }
};

const getJsonDepth = (obj: unknown, depth = 0): number => {
  if (typeof obj !== 'object' || obj === null) return depth;
  const children = Array.isArray(obj)
    ? obj
    : Object.values(obj as Record<string, unknown>);
  if (children.length === 0) return depth;
  return Math.max(...children.map(child => getJsonDepth(child, depth + 1)));
};

const getRootKeyCount = (obj: unknown): number => {
  if (typeof obj !== 'object' || obj === null) return 0;
  if (Array.isArray(obj)) return obj.length;
  return Object.keys(obj as Record<string, unknown>).length;
};

const getSizeString = (text: string): string => {
  const bytes = new TextEncoder().encode(text).length;
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
};

const getIndentValue = (indentSize: IndentSize): string | number => {
  if (indentSize === 'tab') return '\t';
  return parseInt(indentSize, 10);
};

export default function JsonLensPage() {
  const { resolvedTheme } = useTheme();
  const editorTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'light';

  const [jsonText, setJsonText] = useState(DEFAULT_JSON);
  const [indentSize, setIndentSize] = useState<IndentSize>('2');

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  const jsonValidation = useMemo(() => parseJsonSafely(jsonText), [jsonText]);

  const jsonStats = useMemo(() => {
    if (!jsonValidation.isValid || jsonText.trim() === '') return null;

    const indent = getIndentValue(indentSize);
    const formatted = JSON.stringify(jsonValidation.value, null, indent);
    const minified = JSON.stringify(jsonValidation.value);

    return {
      size: getSizeString(jsonText),
      lines: jsonText.split('\n').length,
      chars: jsonText.length,
      rootKeys: getRootKeyCount(jsonValidation.value),
      depth: getJsonDepth(jsonValidation.value),
      formattedSize: getSizeString(formatted),
      minifiedSize: getSizeString(minified),
      isArray: Array.isArray(jsonValidation.value),
    };
  }, [jsonValidation.isValid, jsonValidation.value, jsonText, indentSize]);

  const handleEditorMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;

      editor.onDidPaste(() => {
        editor.getAction('editor.action.formatDocument')?.run();
      });
    },
    []
  );

  const applyTextToEditor = useCallback((newText: string) => {
    const editor = editorRef.current;
    if (!editor) {
      setJsonText(newText);
      return;
    }

    const model = editor.getModel();
    if (!model) {
      setJsonText(newText);
      return;
    }

    editor.pushUndoStop();
    editor.executeEdits('json-lens', [
      {
        range: model.getFullModelRange(),
        text: newText,
      },
    ]);
    editor.pushUndoStop();
    setJsonText(newText);
  }, []);

  const handleFormat = useCallback(() => {
    if (!jsonValidation.isValid) {
      toast.error('Invalid JSON. Unable to format.');
      return;
    }

    try {
      const indent = getIndentValue(indentSize);
      const formatted = `${JSON.stringify(jsonValidation.value, null, indent)}\n`;
      applyTextToEditor(formatted);
      toast.success('JSON formatted.');
    } catch {
      toast.error('Failed to format JSON.');
    }
  }, [
    jsonValidation.isValid,
    jsonValidation.value,
    indentSize,
    applyTextToEditor,
  ]);

  const handleMinify = useCallback(() => {
    if (!jsonValidation.isValid) {
      toast.error('Invalid JSON. Unable to minify.');
      return;
    }

    try {
      const minified = JSON.stringify(jsonValidation.value);
      applyTextToEditor(minified);
      toast.success('JSON minified.');
    } catch {
      toast.error('Failed to minify JSON.');
    }
  }, [jsonValidation.isValid, jsonValidation.value, applyTextToEditor]);

  const handleClear = useCallback(() => {
    applyTextToEditor('');
    toast.success('Editor cleared.');
  }, [applyTextToEditor]);

  const handleCopy = useCallback(async () => {
    if (!jsonText) {
      toast.error('Nothing to copy.');
      return;
    }

    try {
      await navigator.clipboard.writeText(jsonText);
      toast.success('JSON copied to clipboard.');
    } catch {
      toast.error('Failed to copy to clipboard.');
    }
  }, [jsonText]);

  return (
    <MainLayout>
      <div className='flex flex-col gap-2 pt-4'>
        {/* Compact toolbar */}
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex items-center gap-3'>
            <h1 className='text-lg font-semibold'>JSON Lens</h1>
            <span className='hidden sm:inline text-sm text-muted-foreground'>
              Edit, validate, and format JSON with real-time feedback.
            </span>
          </div>
          <div className='flex items-center gap-1.5'>
            <Tabs
              value={indentSize}
              onValueChange={value => setIndentSize(value as IndentSize)}
            >
              <TabsList className='h-8'>
                <TabsTrigger value='2' className='text-xs px-2.5'>
                  2 sp
                </TabsTrigger>
                <TabsTrigger value='4' className='text-xs px-2.5'>
                  4 sp
                </TabsTrigger>
                <TabsTrigger value='tab' className='text-xs px-2.5'>
                  Tab
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Separator
              orientation='vertical'
              className='data-[orientation=vertical]:h-4'
            />
            <Button
              variant='ghost'
              size='sm'
              onClick={handleFormat}
              disabled={!jsonValidation.isValid}
            >
              <TextInitial className='h-4 w-4' />
              <span className='hidden md:inline'>Format</span>
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleMinify}
              disabled={!jsonValidation.isValid}
            >
              <Minimize2 className='h-4 w-4' />
              <span className='hidden md:inline'>Minify</span>
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleCopy}
              disabled={!jsonText}
            >
              <Copy className='h-4 w-4' />
              <span className='hidden md:inline'>Copy</span>
            </Button>
            <Separator
              orientation='vertical'
              className='data-[orientation=vertical]:h-4'
            />
            <Button variant='ghost' size='sm' onClick={handleClear}>
              <Eraser className='h-4 w-4' />
              <span className='hidden md:inline'>Clear</span>
            </Button>
          </div>
        </div>

        {/* Editor + Inspector grid */}
        <div className='grid grid-cols-1 xl:grid-cols-[7fr_3fr] gap-2'>
          {/* Editor */}
          <div className='flex flex-col gap-1'>
            <div className='flex items-center justify-between px-1'>
              <span className='text-xs font-medium text-muted-foreground flex items-center gap-1.5'>
                <FileCode2 className='h-3.5 w-3.5' />
                Editor
              </span>
              {jsonText.trim() === '' ? (
                <Badge
                  variant='secondary'
                  className='font-mono text-[10px] px-1.5 py-0'
                >
                  Empty
                </Badge>
              ) : jsonValidation.error ? (
                <span className='text-xs text-destructive truncate max-w-[60%]'>
                  {jsonValidation.error}
                </span>
              ) : (
                <Badge
                  variant='default'
                  className='bg-green-600 font-mono text-[10px] px-1.5 py-0'
                >
                  Valid
                </Badge>
              )}
            </div>
            <div className='rounded-lg border bg-muted/30 overflow-hidden'>
              <Editor
                height='calc(100vh - 220px)'
                language='json'
                value={jsonText}
                theme={editorTheme}
                onChange={value => setJsonText(value ?? '')}
                onMount={handleEditorMount}
                options={{
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  scrollBeyondLastLine: false,
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>
          </div>

          {/* Inspector */}
          <div className='flex flex-col gap-1'>
            <div className='flex items-center px-1'>
              <span className='text-xs font-medium text-muted-foreground flex items-center gap-1.5'>
                <ScanSearch className='h-3.5 w-3.5' />
                Inspector
              </span>
            </div>
            <div className='h-[calc(100vh-220px)] overflow-y-auto rounded-lg border bg-muted/30 p-4'>
              <div className='space-y-2'>
                {/* Structure */}
                <div className='space-y-1.5 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Type</span>
                    <span className='font-mono font-semibold'>
                      {jsonStats ? (jsonStats.isArray ? 'Array' : 'Object') : '—'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      {jsonStats?.isArray ? 'Items' : 'Root Keys'}
                    </span>
                    <span className='font-mono font-semibold'>
                      {jsonStats ? jsonStats.rootKeys : '—'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Max Depth</span>
                    <span className='font-mono font-semibold'>
                      {jsonStats ? jsonStats.depth : '—'}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Content */}
                <div className='space-y-1.5 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Lines</span>
                    <span className='font-mono font-semibold'>
                      {jsonStats ? jsonStats.lines : '—'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Characters</span>
                    <span className='font-mono font-semibold'>
                      {jsonStats ? jsonStats.chars.toLocaleString() : '—'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Size</span>
                    <span className='font-mono font-semibold'>
                      {jsonStats ? jsonStats.size : '—'}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Compression */}
                <div className='space-y-1.5 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Formatted</span>
                    <span className='font-mono font-semibold text-blue-500'>
                      {jsonStats ? jsonStats.formattedSize : '—'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Minified</span>
                    <span className='font-mono font-semibold text-green-500'>
                      {jsonStats ? jsonStats.minifiedSize : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
