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
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto space-y-8'>
          <ToolPageHeader
            title='JSON Lens'
            description='Edit, validate, and format JSON data with syntax highlighting and real-time feedback.'
          />

          <div className='grid grid-cols-1 xl:grid-cols-[7fr_3fr] gap-6'>
            {/* JSON Editor Card */}
            <Card className='flex flex-col'>
              <CardHeader className='flex flex-row items-center justify-between gap-4'>
                <CardTitle className='flex items-center gap-2'>
                  <FileCode2 className='h-5 w-5' />
                  JSON Editor
                </CardTitle>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={handleFormat}
                    disabled={!jsonValidation.isValid}
                  >
                    <TextInitial className='h-4 w-4 mr-2' />
                    Format
                  </Button>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={handleMinify}
                    disabled={!jsonValidation.isValid}
                  >
                    <Minimize2 className='h-4 w-4 mr-2' />
                    Minify
                  </Button>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={handleCopy}
                    disabled={!jsonText}
                  >
                    <Copy className='h-4 w-4 mr-2' />
                    Copy
                  </Button>
                  <Button variant='ghost' size='sm' onClick={handleClear}>
                    <Eraser className='h-4 w-4 mr-2' />
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='flex flex-col gap-3 flex-1'>
                <div className='rounded-lg border bg-muted/30 overflow-hidden flex-1'>
                  <Editor
                    height='500px'
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
                {jsonText.trim() === '' ? (
                  <div className='flex items-center gap-2'>
                    <Badge variant='secondary' className='font-mono text-xs'>
                      Empty
                    </Badge>
                    <p className='text-xs text-muted-foreground'>
                      Paste or type JSON to get started.
                    </p>
                  </div>
                ) : jsonValidation.error ? (
                  <div className='flex items-center gap-2'>
                    <Badge variant='destructive' className='font-mono text-xs'>
                      Error
                    </Badge>
                    <p className='text-xs text-destructive font-mono'>
                      {jsonValidation.error}
                    </p>
                  </div>
                ) : (
                  <div className='flex items-center gap-2'>
                    <Badge
                      variant='default'
                      className='bg-green-600 font-mono text-xs'
                    >
                      Valid
                    </Badge>
                    <p className='text-xs text-muted-foreground'>
                      JSON is valid.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inspector Card */}
            <Card className='flex flex-col'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ScanSearch className='h-5 w-5' />
                  Inspector
                </CardTitle>
              </CardHeader>
              <CardContent className='flex flex-col gap-6'>
                {/* Indent Options */}
                <div className='space-y-3 p-4 rounded-lg border bg-card'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Indent Style</span>
                    <Tabs
                      value={indentSize}
                      onValueChange={value =>
                        setIndentSize(value as IndentSize)
                      }
                    >
                      <TabsList className='grid w-[240px] grid-cols-3'>
                        <TabsTrigger value='2'>2 Spaces</TabsTrigger>
                        <TabsTrigger value='4'>4 Spaces</TabsTrigger>
                        <TabsTrigger value='tab'>Tab</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                {/* JSON Statistics */}
                {jsonStats ? (
                  <div className='space-y-3 p-4 rounded-lg border bg-card'>
                    <p className='text-sm font-medium'>Statistics</p>
                    <Separator />
                    <div className='grid grid-cols-2 gap-x-6 gap-y-3 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Type</span>
                        <span className='font-mono font-medium'>
                          {jsonStats.isArray ? 'Array' : 'Object'}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>
                          {jsonStats.isArray ? 'Items' : 'Root Keys'}
                        </span>
                        <span className='font-mono font-medium'>
                          {jsonStats.rootKeys}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Max Depth</span>
                        <span className='font-mono font-medium'>
                          {jsonStats.depth}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Lines</span>
                        <span className='font-mono font-medium'>
                          {jsonStats.lines}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>
                          Characters
                        </span>
                        <span className='font-mono font-medium'>
                          {jsonStats.chars.toLocaleString()}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Size</span>
                        <span className='font-mono font-medium'>
                          {jsonStats.size}
                        </span>
                      </div>
                    </div>
                    <Separator />
                    <div className='grid grid-cols-2 gap-x-6 gap-y-3 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Formatted</span>
                        <span className='font-mono font-medium text-blue-500'>
                          {jsonStats.formattedSize}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Minified</span>
                        <span className='font-mono font-medium text-green-500'>
                          {jsonStats.minifiedSize}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='p-4 rounded-lg border bg-card flex items-center justify-center h-[200px]'>
                    <p className='text-sm text-muted-foreground text-center'>
                      {jsonText.trim() === ''
                        ? 'Enter valid JSON to see statistics.'
                        : 'Fix JSON errors to see statistics.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
