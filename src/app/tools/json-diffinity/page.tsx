'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import Editor from '@monaco-editor/react';
import { findNodeAtLocation, parseTree } from 'jsonc-parser';
import { Braces, GitCompare, Sparkles } from 'lucide-react';
import type * as Monaco from 'monaco-editor';
import { useTheme } from 'next-themes';
import parserBabel from 'prettier/plugins/babel';
import parserEstree from 'prettier/plugins/estree';
import prettier from 'prettier/standalone';
import { toast } from 'sonner';

import { MainLayout } from '@/components/layouts';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type JsonPath, computeJsonDiff, formatDiffHtml } from '@/lib/diff';
import { cn } from '@/lib/utils';

const DEFAULT_ORIGINAL = `{
  "service": "payments",
  "version": 1,
  "features": {
    "fraudProtection": true,
    "currencies": ["USD", "EUR", "JPY"]
  },
  "limits": {
    "daily": 5000,
    "monthly": 50000
  },
  "owners": ["alex", "morgan"]
}`;

const DEFAULT_MODIFIED = `{
  "service": "payments",
  "version": 2,
  "features": {
    "fraudProtection": false,
    "currencies": ["USD", "EUR", "JPY", "GBP"],
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

const formatJsonWithPrettier = async (value: string) => {
  // Prettier runs entirely in the browser and provides consistent JSON formatting.
  return await prettier.format(value, {
    parser: 'json',
    plugins: [parserBabel, parserEstree],
    printWidth: 80,
    tabWidth: 2,
  });
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

export default function JsonDiffPage() {
  const { resolvedTheme } = useTheme();
  const editorTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'light';

  const [originalText, setOriginalText] = useState(DEFAULT_ORIGINAL);
  const [modifiedText, setModifiedText] = useState(DEFAULT_MODIFIED);
  const [diffHtml, setDiffHtml] = useState('');

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

    const jsonDefaults = (monaco.languages as any).json?.jsonDefaults;

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
      applyDecorations({ left: [], right: [], modified: [] });
      toast.success('No differences found.');
      return;
    }

    setDiffHtml(formatDiffHtml(delta, originalValidation.value));
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
        const formatted = await formatJsonWithPrettier(value);
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
      } catch (error) {
        toast.error('Invalid JSON. Unable to format.');
      }
    },
    []
  );

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto space-y-8'>
          <ToolPageHeader
            title='JSON Diffinity'
            description='Compare two JSON payloads with editor-grade highlighting and a visual diff viewer.'
          />

          <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
            <Card className='flex flex-col'>
              <CardHeader className='flex flex-row items-center justify-between gap-4'>
                <CardTitle className='flex items-center gap-2'>
                  <Braces className='h-5 w-5' />
                  Original JSON
                </CardTitle>
                <Button
                  variant='secondary'
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
                  <Sparkles className='h-4 w-4 mr-2' />
                  Format JSON
                </Button>
              </CardHeader>
              <CardContent className='flex flex-col gap-3'>
                <div className='rounded-lg border bg-muted/30 overflow-hidden'>
                  <Editor
                    height='420px'
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
                {originalValidation.error ? (
                  <p className='text-sm text-destructive'>
                    {originalValidation.error}
                  </p>
                ) : (
                  <p className='text-xs text-muted-foreground'>
                    JSON is valid and ready to compare.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className='flex flex-col'>
              <CardHeader className='flex flex-row items-center justify-between gap-4'>
                <CardTitle className='flex items-center gap-2'>
                  <Braces className='h-5 w-5' />
                  Modified JSON
                </CardTitle>
                <Button
                  variant='secondary'
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
                  <Sparkles className='h-4 w-4 mr-2' />
                  Format JSON
                </Button>
              </CardHeader>
              <CardContent className='flex flex-col gap-3'>
                <div className='rounded-lg border bg-muted/30 overflow-hidden'>
                  <Editor
                    height='420px'
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
                {modifiedValidation.error ? (
                  <p className='text-sm text-destructive'>
                    {modifiedValidation.error}
                  </p>
                ) : (
                  <p className='text-xs text-muted-foreground'>
                    JSON is valid and ready to compare.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <Button onClick={handleCompare} disabled={isCompareDisabled}>
              <GitCompare className='h-4 w-4 mr-2' />
              Compare JSON
            </Button>
            <span
              className={cn(
                'text-sm',
                isCompareDisabled ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {isCompareDisabled
                ? 'Fix JSON errors to enable comparison.'
                : 'Changes are highlighted in the editors and viewer.'}
            </span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Diffinity Viewer</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-[420px] rounded-lg border bg-muted/30'>
                <div className='p-4'>
                  {diffHtml ? (
                    <div
                      className='json-diff-viewer'
                      dangerouslySetInnerHTML={{ __html: diffHtml }}
                    />
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      Run a comparison to see the visual diff output here.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
