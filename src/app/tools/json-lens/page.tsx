'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Editor from '@monaco-editor/react';
import { Check, Copy, Eraser, Minimize2, Settings, TextInitial } from 'lucide-react';
import type * as Monaco from 'monaco-editor';
import { useTheme } from 'next-themes';

import MainLayout from '@/components/layouts/main-layout';
import { ActionButton } from '@/components/action-button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { COPY_FEEDBACK_DURATION } from '@/lib/constants';

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

function useActionFeedback() {
  const [active, setActive] = useState<Set<string>>(new Set());
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const trigger = useCallback((id: string) => {
    const existing = timeouts.current.get(id);
    if (existing) clearTimeout(existing);

    setActive(prev => new Set(prev).add(id));

    const timeout = setTimeout(() => {
      setActive(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      timeouts.current.delete(id);
    }, COPY_FEEDBACK_DURATION);

    timeouts.current.set(id, timeout);
  }, []);

  useEffect(() => {
    const refs = timeouts.current;
    return () => {
      refs.forEach(t => clearTimeout(t));
    };
  }, []);

  return { active, trigger };
}

export default function JsonLensPage() {
  const { resolvedTheme } = useTheme();
  const editorTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'light';
  const { active, trigger } = useActionFeedback();

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
    if (!jsonValidation.isValid) return;

    try {
      const indent = getIndentValue(indentSize);
      const formatted = `${JSON.stringify(jsonValidation.value, null, indent)}\n`;
      applyTextToEditor(formatted);
      trigger('format');
    } catch {
      // silently fail
    }
  }, [
    jsonValidation.isValid,
    jsonValidation.value,
    indentSize,
    applyTextToEditor,
    trigger,
  ]);

  const handleMinify = useCallback(() => {
    if (!jsonValidation.isValid) return;

    try {
      const minified = JSON.stringify(jsonValidation.value);
      applyTextToEditor(minified);
      trigger('minify');
    } catch {
      // silently fail
    }
  }, [jsonValidation.isValid, jsonValidation.value, applyTextToEditor, trigger]);

  const handleClear = useCallback(() => {
    applyTextToEditor('');
    trigger('clear');
  }, [applyTextToEditor, trigger]);

  const handleCopy = useCallback(async () => {
    if (!jsonText) return;

    try {
      await navigator.clipboard.writeText(jsonText);
      trigger('copy');
    } catch {
      // silently fail
    }
  }, [jsonText, trigger]);

  const optionsContent = (
    <div className='flex items-center justify-between lg:justify-start gap-2'>
      <span className='text-xs text-muted-foreground lg:hidden'>Indent</span>
      <Tabs
        value={indentSize}
        onValueChange={value => setIndentSize(value as IndentSize)}
      >
        <TabsList className='h-8'>
          <TabsTrigger value='2' className='text-xs px-2.5'>
            2 spaces
          </TabsTrigger>
          <TabsTrigger value='4' className='text-xs px-2.5'>
            4 spaces
          </TabsTrigger>
          <TabsTrigger value='tab' className='text-xs px-2.5'>
            Tab
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );

  return (
    <MainLayout>
      <div className='flex flex-col h-[calc(100vh-57px)]'>
        {/* Toolbar */}
        <div className='flex items-center justify-between gap-2 py-2'>
          {/* Left: title */}
          <div className='flex items-center gap-3'>
            <h1 className='text-lg font-semibold'>JSON Lens</h1>
          </div>

          {/* Center: options (desktop) */}
          <div className='hidden lg:flex items-center gap-2'>
            {optionsContent}
          </div>

          {/* Center: settings popover (mobile) */}
          <div className='lg:hidden'>
            <Popover>
              <PopoverTrigger asChild>
                <ActionButton variant='ghost' size='sm' leftIcon={<Settings />}>
                  Settings
                </ActionButton>
              </PopoverTrigger>
              <PopoverContent className='w-72'>
                <div className='flex flex-col gap-3'>{optionsContent}</div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right: actions */}
          <div className='flex items-center gap-1'>
            <ActionButton
              variant='ghost'
              size='sm'
              onClick={handleFormat}
              disabled={!jsonValidation.isValid}
              leftIcon={active.has('format') ? <Check className='text-green-500' /> : <TextInitial />}
            >
              <span className='hidden md:inline'>
                {active.has('format') ? 'Formatted' : 'Format'}
              </span>
            </ActionButton>
            <ActionButton
              variant='ghost'
              size='sm'
              onClick={handleMinify}
              disabled={!jsonValidation.isValid}
              leftIcon={active.has('minify') ? <Check className='text-green-500' /> : <Minimize2 />}
            >
              <span className='hidden md:inline'>
                {active.has('minify') ? 'Minified' : 'Minify'}
              </span>
            </ActionButton>
            <ActionButton
              variant='ghost'
              size='sm'
              onClick={handleCopy}
              disabled={!jsonText}
              leftIcon={active.has('copy') ? <Check className='text-green-500' /> : <Copy />}
            >
              <span className='hidden md:inline'>
                {active.has('copy') ? 'Copied' : 'Copy'}
              </span>
            </ActionButton>
            <ActionButton variant='ghost' size='sm' onClick={handleClear} leftIcon={active.has('clear') ? <Check className='text-green-500' /> : <Eraser />}>
              <span className='hidden md:inline'>
                {active.has('clear') ? 'Cleared' : 'Clear'}
              </span>
            </ActionButton>
          </div>
        </div>

        {/* Editor + Inspector */}
        <div className='grid grid-cols-1 lg:grid-cols-[8fr_2fr] flex-1 min-h-0 gap-1'>
          {/* Editor */}
          <div className='flex flex-col min-h-0 rounded-sm overflow-hidden'>
            <Editor
              height='100%'
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

          {/* Inspector */}
          <div className='flex flex-col min-h-0 rounded-sm overflow-hidden lg:overflow-y-auto p-4'>
            <div className='space-y-2'>
              {/* Structure */}
              <div className='space-y-1.5 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Type</span>
                  <span className='font-mono font-semibold'>
                    {jsonStats
                      ? jsonStats.isArray
                        ? 'Array'
                        : 'Object'
                      : '—'}
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
    </MainLayout>
  );
}
