'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import Editor from '@monaco-editor/react';
import { Check, Copy, Eraser, Settings } from 'lucide-react';
import type * as Monaco from 'monaco-editor';
import { useTheme } from 'next-themes';

import MainLayout from '@/components/layouts/main-layout';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import {
  DEFAULT_JSON,
  generateJsCode,
  parseJsonSafely,
} from '@/lib/json-objectify';
import type { ConversionOptions } from '@/lib/json-objectify';

export default function JsonObjectifyPage() {
  const { resolvedTheme } = useTheme();
  const editorTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'light';
  const { copiedId, copy } = useCopyToClipboard();

  const [jsonText, setJsonText] = useState(DEFAULT_JSON);
  const [outputType, setOutputType] = useState<'const' | 'let'>('const');
  const [quoteStyle, setQuoteStyle] = useState<'single' | 'double'>('single');
  const [trailingComma, setTrailingComma] = useState(true);
  const [semicolons, setSemicolons] = useState(true);
  const [typescript, setTypescript] = useState(false);
  const [variableName, setVariableName] = useState('data');

  const jsonEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(
    null
  );

  const jsonValidation = useMemo(() => parseJsonSafely(jsonText), [jsonText]);

  const jsOutput = useMemo(() => {
    if (!jsonValidation.isValid || !jsonText.trim()) {
      return '';
    }

    const options: ConversionOptions = {
      useConst: outputType === 'const',
      singleQuotes: quoteStyle === 'single',
      trailingComma,
      semicolons,
      typescript,
      variableName: variableName || 'data',
    };

    return generateJsCode(jsonValidation.value, options);
  }, [
    jsonValidation.isValid,
    jsonValidation.value,
    jsonText,
    outputType,
    quoteStyle,
    trailingComma,
    semicolons,
    typescript,
    variableName,
  ]);

  const outputLanguage = typescript ? 'typescript' : 'javascript';
  const outputDisplayValue =
    jsOutput || '// Paste valid JSON on the left to see the output here';

  const handleJsonEditorMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      jsonEditorRef.current = editor;

      editor.onDidPaste(() => {
        editor.getAction('editor.action.formatDocument')?.run();
      });
    },
    []
  );

  const handleClear = useCallback(() => {
    setJsonText('');
  }, []);

  const handleCopy = useCallback(() => {
    if (jsOutput) {
      copy(jsOutput);
    }
  }, [jsOutput, copy]);

  const optionsContent = (
    <>
      <div className='flex items-center justify-between lg:justify-start gap-2'>
        <span className='text-xs text-muted-foreground lg:hidden'>Type</span>
        <Tabs
          value={outputType}
          onValueChange={value => setOutputType(value as 'const' | 'let')}
        >
          <TabsList className='h-8'>
            <TabsTrigger value='const' className='text-xs px-2.5'>
              const
            </TabsTrigger>
            <TabsTrigger value='let' className='text-xs px-2.5'>
              let
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator
        orientation='vertical'
        className='hidden lg:block data-[orientation=vertical]:h-4'
      />
      <Separator className='lg:hidden' />

      <div className='flex items-center justify-between lg:justify-start gap-2'>
        <span className='text-xs text-muted-foreground lg:hidden'>Quotes</span>
        <Tabs
          value={quoteStyle}
          onValueChange={value => setQuoteStyle(value as 'single' | 'double')}
        >
          <TabsList className='h-8'>
            <TabsTrigger value='single' className='text-xs px-2.5'>
              &apos;single&apos;
            </TabsTrigger>
            <TabsTrigger value='double' className='text-xs px-2.5'>
              &quot;double&quot;
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator
        orientation='vertical'
        className='hidden lg:block data-[orientation=vertical]:h-4'
      />
      <Separator className='lg:hidden' />

      <div className='flex items-center justify-between lg:justify-start gap-2'>
        <span className='text-xs text-muted-foreground lg:hidden'>
          Trailing Comma
        </span>
        <Tabs
          value={trailingComma ? 'yes' : 'no'}
          onValueChange={value => setTrailingComma(value === 'yes')}
        >
          <TabsList className='h-8'>
            <TabsTrigger value='yes' className='text-xs px-2.5'>
              Comma
            </TabsTrigger>
            <TabsTrigger value='no' className='text-xs px-2.5'>
              No comma
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator
        orientation='vertical'
        className='hidden lg:block data-[orientation=vertical]:h-4'
      />
      <Separator className='lg:hidden' />

      <div className='flex items-center justify-between lg:justify-start gap-2'>
        <span className='text-xs text-muted-foreground lg:hidden'>
          Semicolons
        </span>
        <Tabs
          value={semicolons ? 'yes' : 'no'}
          onValueChange={value => setSemicolons(value === 'yes')}
        >
          <TabsList className='h-8'>
            <TabsTrigger value='yes' className='text-xs px-2.5'>
              Semi
            </TabsTrigger>
            <TabsTrigger value='no' className='text-xs px-2.5'>
              No semi
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator
        orientation='vertical'
        className='hidden lg:block data-[orientation=vertical]:h-4'
      />
      <Separator className='lg:hidden' />

      <div className='flex items-center justify-between lg:justify-start gap-2'>
        <span className='text-xs text-muted-foreground lg:hidden'>Output</span>
        <Tabs
          value={typescript ? 'ts' : 'js'}
          onValueChange={value => setTypescript(value === 'ts')}
        >
          <TabsList className='h-8'>
            <TabsTrigger value='js' className='text-xs px-2.5'>
              JS
            </TabsTrigger>
            <TabsTrigger value='ts' className='text-xs px-2.5'>
              TS
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator
        orientation='vertical'
        className='hidden lg:block data-[orientation=vertical]:h-4'
      />
      <Separator className='lg:hidden' />

      <div className='flex items-center justify-between lg:justify-start gap-2'>
        <label
          htmlFor='variableName'
          className='text-xs text-muted-foreground lg:hidden'
        >
          Variable Name
        </label>
        <input
          id='variableName'
          type='text'
          value={variableName}
          onChange={e => setVariableName(e.target.value)}
          className='w-full lg:w-24 h-8 px-2 text-xs rounded-md border bg-background'
          placeholder='data'
        />
      </div>
    </>
  );

  return (
    <MainLayout>
      <div className='flex flex-col h-[calc(100vh-57px)]'>
        {/* Split Toolbar */}
        <div className='flex items-center justify-between gap-2 py-2'>
          {/* Left: title */}
          <div className='flex items-center gap-3'>
            <h1 className='text-lg font-semibold'>JSON Objectify</h1>
          </div>

          {/* Center: options (desktop) */}
          <div className='hidden lg:flex items-center gap-2'>
            {optionsContent}
          </div>

          {/* Center: settings popover (mobile) */}
          <div className='lg:hidden'>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='ghost' size='sm'>
                  <Settings className='size-4' />
                  <span>Settings</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-72'>
                <div className='flex flex-col gap-3'>{optionsContent}</div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right: clear + copy */}
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleCopy}
              disabled={!jsOutput}
            >
              {copiedId ? (
                <Check className='size-4 text-green-500' />
              ) : (
                <Copy className='size-4' />
              )}
              <span className='hidden md:inline'>
                {copiedId ? 'Copied' : 'Copy'}
              </span>
            </Button>
            <Button variant='ghost' size='sm' onClick={handleClear}>
              <Eraser className='size-4' />
              <span className='hidden md:inline'>Clear</span>
            </Button>
          </div>
        </div>

        {/* Editors */}
        <div className='grid grid-cols-1 lg:grid-cols-2 flex-1 min-h-0 gap-1'>
          {/* JSON Input */}
          <div className='flex flex-col min-h-0 rounded-sm overflow-hidden'>
            <Editor
              height='100%'
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

          {/* Output */}
          <div className='flex flex-col min-h-0 rounded-sm overflow-hidden'>
            <Editor
              height='100%'
              language={outputLanguage}
              value={outputDisplayValue}
              theme={editorTheme}
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
        </div>
      </div>
    </MainLayout>
  );
}
