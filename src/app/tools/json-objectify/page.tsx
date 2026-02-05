'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import Editor from '@monaco-editor/react';
import { Braces, Copy, Eraser, Sparkles, TextInitial } from 'lucide-react';
import type * as Monaco from 'monaco-editor';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface ConversionOptions {
  useConst: boolean;
  singleQuotes: boolean;
  trailingComma: boolean;
  includeUndefined: boolean;
}

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

const convertToJsObject = (
  obj: unknown,
  options: ConversionOptions,
  indent = 0
): string => {
  const indentStr = '  '.repeat(indent);
  const nextIndentStr = '  '.repeat(indent + 1);

  if (obj === null) {
    return 'null';
  }

  if (obj === undefined) {
    return 'undefined';
  }

  if (typeof obj === 'string') {
    const quote = options.singleQuotes ? "'" : '"';
    return `${quote}${obj}${quote}`;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '[]';
    }

    const items = obj.map(item => convertToJsObject(item, options, indent + 1));
    const trailing = options.trailingComma ? ',' : '';
    return `[\n${items.map(item => `${nextIndentStr}${item}`).join(',\n')}${trailing}\n${indentStr}]`;
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj);

    if (entries.length === 0) {
      return '{}';
    }

    const props = entries.map(([key, value]) => {
      // Check if key is a valid JS identifier
      const needsQuotes = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
      const quote = options.singleQuotes ? "'" : '"';
      const keyStr = needsQuotes ? `${quote}${key}${quote}` : key;
      const valueStr = convertToJsObject(value, options, indent + 1);
      return `${nextIndentStr}${keyStr}: ${valueStr}`;
    });

    const trailing = options.trailingComma ? ',' : '';
    return `{\n${props.join(',\n')}${trailing}\n${indentStr}}`;
  }

  return String(obj);
};

const generateJsCode = (
  json: unknown,
  options: ConversionOptions,
  variableName: string = 'data'
): string => {
  const keyword = options.useConst ? 'const' : 'let';
  const objectStr = convertToJsObject(json, options);
  return `${keyword} ${variableName} = ${objectStr};`;
};

export default function JsonObjectifyPage() {
  const { resolvedTheme } = useTheme();
  const editorTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'light';

  const [jsonText, setJsonText] = useState(DEFAULT_JSON);
  const [outputType, setOutputType] = useState<'const' | 'let'>('const');
  const [quoteStyle, setQuoteStyle] = useState<'single' | 'double'>('single');
  const [trailingComma, setTrailingComma] = useState(true);
  const [variableName, setVariableName] = useState('data');

  const jsonEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(
    null
  );
  const outputEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(
    null
  );

  const jsonValidation = useMemo(() => parseJsonSafely(jsonText), [jsonText]);

  const jsOutput = useMemo(() => {
    if (!jsonValidation.isValid) {
      return '';
    }

    const options: ConversionOptions = {
      useConst: outputType === 'const',
      singleQuotes: quoteStyle === 'single',
      trailingComma,
      includeUndefined: false,
    };

    return generateJsCode(jsonValidation.value, options, variableName);
  }, [
    jsonValidation.isValid,
    jsonValidation.value,
    outputType,
    quoteStyle,
    trailingComma,
    variableName,
  ]);

  const handleJsonEditorMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      jsonEditorRef.current = editor;

      editor.onDidPaste(() => {
        editor.getAction('editor.action.formatDocument')?.run();
      });
    },
    []
  );

  const handleOutputEditorMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      outputEditorRef.current = editor;
    },
    []
  );

  const handleFormatJson = useCallback(async () => {
    const editor = jsonEditorRef.current;

    if (!editor) {
      return;
    }

    try {
      const formatted = await formatJson(jsonText);
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

      setJsonText(formatted);
      toast.success('JSON formatted.');
    } catch (error) {
      toast.error('Invalid JSON. Unable to format.');
    }
  }, [jsonText]);

  const handleClearJson = useCallback(() => {
    setJsonText('');
    toast.success('JSON input cleared.');
  }, []);

  const handleCopyOutput = useCallback(async () => {
    if (!jsOutput) {
      toast.error('No output to copy.');
      return;
    }

    try {
      await navigator.clipboard.writeText(jsOutput);
      toast.success('JavaScript code copied to clipboard.');
    } catch (error) {
      toast.error('Failed to copy to clipboard.');
    }
  }, [jsOutput]);

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto space-y-8'>
          <ToolPageHeader
            title='JSON Objectify'
            description='Transform JSON into clean, idiomatic JavaScript object notation with customizable formatting options.'
          />

          <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
            {/* JSON Input Card */}
            <Card className='flex flex-col'>
              <CardHeader className='flex flex-row items-center justify-between gap-4'>
                <CardTitle className='flex items-center gap-2'>
                  <Braces className='h-5 w-5' />
                  JSON Input
                </CardTitle>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={handleFormatJson}
                    disabled={!jsonValidation.isValid}
                  >
                    <TextInitial className='h-4 w-4 mr-2' />
                    Format
                  </Button>
                  <Button variant='ghost' size='sm' onClick={handleClearJson}>
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
                    onMount={handleJsonEditorMount}
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
                {jsonValidation.error ? (
                  <div className='flex items-center gap-2'>
                    <Badge variant='destructive' className='font-mono text-xs'>
                      Error
                    </Badge>
                    <p className='text-xs text-destructive'>
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
                      JSON is valid and ready to convert.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* JavaScript Output Card */}
            <Card className='flex flex-col'>
              <CardHeader className='flex flex-row items-center justify-between gap-4'>
                <CardTitle className='flex items-center gap-2'>
                  <Sparkles className='h-5 w-5' />
                  JavaScript Output
                </CardTitle>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={handleCopyOutput}
                  disabled={!jsOutput}
                >
                  <Copy className='h-4 w-4 mr-2' />
                  Copy
                </Button>
              </CardHeader>
              <CardContent className='flex flex-col gap-4 flex-1'>
                <div className='rounded-lg border bg-muted/30 overflow-hidden flex-1'>
                  <Editor
                    height='500px'
                    language='javascript'
                    value={jsOutput}
                    theme={editorTheme}
                    onMount={handleOutputEditorMount}
                    options={{
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      automaticLayout: true,
                      readOnly: true,
                      scrollBeyondLastLine: false,
                      padding: { top: 12, bottom: 12 },
                    }}
                  />
                </div>

                {/* Options Panel */}
                <div className='space-y-4 p-4 rounded-lg border bg-card'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Variable Type</span>
                    <Tabs
                      value={outputType}
                      onValueChange={value =>
                        setOutputType(value as 'const' | 'let')
                      }
                    >
                      <TabsList className='grid w-[200px] grid-cols-2'>
                        <TabsTrigger value='const'>const</TabsTrigger>
                        <TabsTrigger value='let'>let</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Quote Style</span>
                    <Tabs
                      value={quoteStyle}
                      onValueChange={value =>
                        setQuoteStyle(value as 'single' | 'double')
                      }
                    >
                      <TabsList className='grid w-[200px] grid-cols-2'>
                        <TabsTrigger value='single'>Single</TabsTrigger>
                        <TabsTrigger value='double'>Double</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Trailing Comma</span>
                    <Tabs
                      value={trailingComma ? 'yes' : 'no'}
                      onValueChange={value => setTrailingComma(value === 'yes')}
                    >
                      <TabsList className='grid w-[200px] grid-cols-2'>
                        <TabsTrigger value='yes'>Yes</TabsTrigger>
                        <TabsTrigger value='no'>No</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className='flex items-center justify-between gap-4'>
                    <label
                      htmlFor='variableName'
                      className='text-sm font-medium'
                    >
                      Variable Name
                    </label>
                    <input
                      id='variableName'
                      type='text'
                      value={variableName}
                      onChange={e => setVariableName(e.target.value)}
                      className='w-[200px] px-3 py-1.5 text-sm rounded-md border bg-background'
                      placeholder='data'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
