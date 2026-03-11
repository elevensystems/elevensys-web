'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import Editor from '@monaco-editor/react';
import { findNodeAtLocation, parseTree } from 'jsonc-parser';
import { Braces, ChevronDown, Eraser, GitCompare, TextInitial } from 'lucide-react';
import type * as Monaco from 'monaco-editor';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import MainLayout from '@/components/layouts/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  type DiffPaths,
  type JsonPath,
  computeJsonDiff,
  formatDiffHtml,
} from '@/lib/diff';
import { cn } from '@/lib/utils';

const DEFAULT_ORIGINAL = `{
  "service": "payments",
  "version": 1,
  "features": {
    "fraudProtection": true,
    "currencies": [
      "USD",
      "EUR",
      "JPY"
    ]
  },
  "limits": {
    "daily": 5000,
    "monthly": 50000
  },
  "owners": [
    "alex",
    "morgan"
  ]
}`;

const DEFAULT_MODIFIED = `{
  "service": "payments",
  "version": 2,
  "features": {
    "fraudProtection": false,
    "currencies": [
      "USD",
      "EUR",
      "JPY",
      "GBP"
    ],
    "retries": 3
  },
  "limits": {
    "daily": 4500,
    "weekly": 12000,
    "monthly": 50000
  }
}`;

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

const formatJson = async (value: string) => {
  const parsed = JSON.parse(value) as unknown;
  return `${JSON.stringify(parsed, null, 2)}\n`;
};

const buildDecorationsForPaths = (
  monaco: typeof Monaco,
  model: Monaco.editor.ITextModel,
  paths: JsonPath[],
  className: string
): Monaco.editor.IModelDeltaDecoration[] => {
  const tree = parseTree(model.getValue());

  if (!tree) {
    return [];
  }

  return paths.flatMap(path => {
    // Diff-to-line mapping is powered by jsonc-parser, which gives us offsets
    // for any JSON path inside the editor content.
    const node = findNodeAtLocation(tree, path);

    if (!node) {
      return [];
    }

    const startPosition = model.getPositionAt(node.offset);
    const endPosition = model.getPositionAt(node.offset + node.length);
    const startLine = startPosition.lineNumber;
    const endLine = Math.max(startLine, endPosition.lineNumber);

    return [
      {
        range: new monaco.Range(startLine, 1, endLine, 1),
        options: {
          isWholeLine: true,
          className,
        },
      },
    ];
  });
};

export default function JsonDiffinityPage() {
  const { resolvedTheme } = useTheme();
  const editorTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'light';

  const [originalText, setOriginalText] = useState(DEFAULT_ORIGINAL);
  const [modifiedText, setModifiedText] = useState(DEFAULT_MODIFIED);
  const [diffHtml, setDiffHtml] = useState('');
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffPaths, setDiffPaths] = useState<DiffPaths | null>(null);

  const monacoRef = useRef<typeof Monaco | null>(null);
  const isMonacoConfiguredRef = useRef(false);

  const originalEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(
    null
  );
  const modifiedEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(
    null
  );

  const originalDecorationsRef = useRef<string[]>([]);
  const modifiedDecorationsRef = useRef<string[]>([]);

  const originalValidation = useMemo(
    () => parseJsonSafely(originalText),
    [originalText]
  );
  const modifiedValidation = useMemo(
    () => parseJsonSafely(modifiedText),
    [modifiedText]
  );

  const isCompareDisabled =
    !originalValidation.isValid || !modifiedValidation.isValid;

  const configureMonaco = useCallback((monaco: typeof Monaco) => {
    if (isMonacoConfiguredRef.current) {
      return;
    }

    const jsonDefaults = (
      monaco.languages as unknown as {
        json?: {
          jsonDefaults?: { setDiagnosticsOptions: (o: object) => void };
        };
      }
    ).json?.jsonDefaults;

    jsonDefaults?.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
    });

    isMonacoConfiguredRef.current = true;
  }, []);

  const handleEditorMount = useCallback(
    (
      editor: Monaco.editor.IStandaloneCodeEditor,
      monaco: typeof Monaco,
      side: 'original' | 'modified'
    ) => {
      configureMonaco(monaco);
      monacoRef.current = monaco;

      editor.onDidPaste(() => {
        editor.getAction('editor.action.formatDocument')?.run();
      });

      if (side === 'original') {
        originalEditorRef.current = editor;
      } else {
        modifiedEditorRef.current = editor;
      }
    },
    [configureMonaco]
  );

  const applyDecorations = useCallback(
    (paths: { left: JsonPath[]; right: JsonPath[]; modified: JsonPath[] }) => {
      const monaco = monacoRef.current;

      if (!monaco) {
        return;
      }

      const originalEditor = originalEditorRef.current;
      const modifiedEditor = modifiedEditorRef.current;

      if (originalEditor) {
        const model = originalEditor.getModel();

        if (model) {
          const newDecorations = [
            ...buildDecorationsForPaths(
              monaco,
              model,
              paths.left,
              'json-diff-removed'
            ),
            ...buildDecorationsForPaths(
              monaco,
              model,
              paths.modified,
              'json-diff-modified'
            ),
          ];

          // Monaco decorations are replaced in bulk so we can clear
          // previous highlights before applying the next comparison.
          originalDecorationsRef.current = originalEditor.deltaDecorations(
            originalDecorationsRef.current,
            newDecorations
          );
        }
      }

      if (modifiedEditor) {
        const model = modifiedEditor.getModel();

        if (model) {
          const newDecorations = [
            ...buildDecorationsForPaths(
              monaco,
              model,
              paths.right,
              'json-diff-added'
            ),
            ...buildDecorationsForPaths(
              monaco,
              model,
              paths.modified,
              'json-diff-modified'
            ),
          ];

          modifiedDecorationsRef.current = modifiedEditor.deltaDecorations(
            modifiedDecorationsRef.current,
            newDecorations
          );
        }
      }
    },
    []
  );

  const clearHighlights = useCallback(() => {
    const originalEditor = originalEditorRef.current;
    const modifiedEditor = modifiedEditorRef.current;

    if (originalEditor) {
      originalDecorationsRef.current = originalEditor.deltaDecorations(
        originalDecorationsRef.current,
        []
      );
    }

    if (modifiedEditor) {
      modifiedDecorationsRef.current = modifiedEditor.deltaDecorations(
        modifiedDecorationsRef.current,
        []
      );
    }
  }, []);

  const handleCompare = useCallback(() => {
    if (isCompareDisabled) {
      toast.error('Fix JSON errors before comparing.');
      return;
    }

    const { delta, paths } = computeJsonDiff(
      originalValidation.value,
      modifiedValidation.value
    );

    if (!delta) {
      setDiffHtml('');
      setDiffPaths(null);
      setDiffOpen(false);
      applyDecorations({ left: [], right: [], modified: [] });
      toast.success('No differences found.');
      return;
    }

    setDiffHtml(formatDiffHtml(delta, originalValidation.value));
    setDiffPaths(paths);
    setDiffOpen(true);
    applyDecorations({
      left: paths.removed,
      right: paths.added,
      modified: paths.modified,
    });
  }, [
    applyDecorations,
    isCompareDisabled,
    modifiedValidation.value,
    originalValidation.value,
  ]);

  const handleClearAll = useCallback(() => {
    setOriginalText('');
    setModifiedText('');
    setDiffHtml('');
    setDiffPaths(null);
    setDiffOpen(false);
    clearHighlights();
  }, [clearHighlights]);

  const handleFormatJson = useCallback(
    async (
      editorRef: React.MutableRefObject<Monaco.editor.IStandaloneCodeEditor | null>,
      value: string,
      onChange: (nextValue: string) => void,
      label: string
    ) => {
      const editor = editorRef.current;

      if (!editor) {
        return;
      }

      try {
        // Prettier integration keeps formatting client-side and preserves
        // cursor position when we rewrite the editor content.
        const formatted = await formatJson(value);
        const model = editor.getModel();

        if (!model) {
          return;
        }

        const cursorOffset = model.getOffsetAt(
          editor.getPosition() ?? { lineNumber: 1, column: 1 }
        );

        editor.pushUndoStop();
        editor.executeEdits('format-json', [
          {
            range: model.getFullModelRange(),
            text: formatted,
          },
        ]);
        editor.pushUndoStop();

        const clampedOffset = Math.min(cursorOffset, model.getValueLength());
        const newPosition = model.getPositionAt(clampedOffset);
        editor.setPosition(newPosition);
        editor.revealPositionInCenterIfOutsideViewport(newPosition);

        onChange(formatted);
        toast.success(`${label} formatted.`);
      } catch {
        toast.error('Invalid JSON. Unable to format.');
      }
    },
    []
  );

  return (
    <MainLayout>
      <div className='flex flex-col gap-2 pt-4'>
        {/* Compact toolbar */}
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex items-center gap-3'>
            <h1 className='text-lg font-semibold'>JSON Diffinity</h1>
            <span className='hidden sm:inline text-sm text-muted-foreground'>
              Compare two JSON payloads with highlighting and a visual diff
              viewer.
            </span>
          </div>
          <div className='flex items-center gap-1.5'>
            <Button
              size='sm'
              onClick={handleCompare}
              disabled={isCompareDisabled}
            >
              <GitCompare className='h-4 w-4' />
              Compare
            </Button>
            <Separator
              orientation='vertical'
              className='data-[orientation=vertical]:h-4'
            />
            <Button
              variant='ghost'
              size='sm'
              onClick={() =>
                handleFormatJson(
                  originalEditorRef,
                  originalText,
                  setOriginalText,
                  'Original JSON'
                )
              }
            >
              <TextInitial className='h-4 w-4' />
              <span className='hidden md:inline'>Format L</span>
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() =>
                handleFormatJson(
                  modifiedEditorRef,
                  modifiedText,
                  setModifiedText,
                  'Modified JSON'
                )
              }
            >
              <TextInitial className='h-4 w-4' />
              <span className='hidden md:inline'>Format R</span>
            </Button>
            <Separator
              orientation='vertical'
              className='data-[orientation=vertical]:h-4'
            />
            <Button variant='ghost' size='sm' onClick={handleClearAll}>
              <Eraser className='h-4 w-4' />
              <span className='hidden md:inline'>Clear All</span>
            </Button>
          </div>
        </div>

        {/* Editors grid */}
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-2'>
          {/* Original editor */}
          <div className='flex flex-col gap-1'>
            <div className='flex items-center justify-between px-1'>
              <span className='text-xs font-medium text-muted-foreground flex items-center gap-1.5'>
                <Braces className='h-3.5 w-3.5' />
                Original
              </span>
              {originalValidation.error ? (
                <span className='text-xs text-destructive truncate max-w-[60%]'>
                  {originalValidation.error}
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
                height='calc(100vh - 240px)'
                language='json'
                value={originalText}
                theme={editorTheme}
                onChange={value => setOriginalText(value ?? '')}
                onMount={(editor, monaco) =>
                  handleEditorMount(editor, monaco, 'original')
                }
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

          {/* Modified editor */}
          <div className='flex flex-col gap-1'>
            <div className='flex items-center justify-between px-1'>
              <span className='text-xs font-medium text-muted-foreground flex items-center gap-1.5'>
                <Braces className='h-3.5 w-3.5' />
                Modified
              </span>
              {modifiedValidation.error ? (
                <span className='text-xs text-destructive truncate max-w-[60%]'>
                  {modifiedValidation.error}
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
                height='calc(100vh - 240px)'
                language='json'
                value={modifiedText}
                theme={editorTheme}
                onChange={value => setModifiedText(value ?? '')}
                onMount={(editor, monaco) =>
                  handleEditorMount(editor, monaco, 'modified')
                }
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
        </div>

        {/* Collapsible diff panel */}
        <Collapsible open={diffOpen} onOpenChange={setDiffOpen}>
          <CollapsibleTrigger asChild>
            <button
              type='button'
              className={cn(
                'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                diffPaths
                  ? 'bg-muted/50 hover:bg-muted'
                  : 'bg-muted/30 text-muted-foreground cursor-default'
              )}
              disabled={!diffPaths}
            >
              <GitCompare className='h-4 w-4 shrink-0' />
              <span>Diff Viewer</span>

              {diffPaths && (
                <div className='flex items-center gap-1.5 ml-2'>
                  {diffPaths.added.length > 0 && (
                    <Badge className='bg-green-600 font-mono text-[10px] px-1.5 py-0'>
                      +{diffPaths.added.length}
                    </Badge>
                  )}
                  {diffPaths.removed.length > 0 && (
                    <Badge
                      variant='destructive'
                      className='font-mono text-[10px] px-1.5 py-0'
                    >
                      -{diffPaths.removed.length}
                    </Badge>
                  )}
                  {diffPaths.modified.length > 0 && (
                    <Badge className='bg-yellow-500 text-white font-mono text-[10px] px-1.5 py-0'>
                      ~{diffPaths.modified.length}
                    </Badge>
                  )}
                </div>
              )}

              <ChevronDown
                className={cn(
                  'ml-auto h-4 w-4 transition-transform duration-200',
                  diffOpen && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className='h-[420px] rounded-lg rounded-t-none border border-t-0 bg-muted/30'>
              <div className='p-4'>
                <div
                  className='json-diff-viewer'
                  dangerouslySetInnerHTML={{ __html: diffHtml }}
                />
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </MainLayout>
  );
}
