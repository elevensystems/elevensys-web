'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Check,
  Code2,
  Copy,
  FileCode,
  FileText,
  Info,
  Loader2,
  ScrollText,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

import { MainLayout } from '@/components/layouts';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  title: string;
  content: string;
  category?: string;
}

export default function PromptTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Load templates on mount and categorize them
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/templates');
        if (!response.ok) {
          throw new Error('Failed to load templates');
        }
        const data = await response.json();
        if (data.success && data.templates) {
          // Auto-categorize templates based on title keywords
          const categorizedTemplates = data.templates.map(
            (template: Template) => {
              const title = template.title.toLowerCase();
              let category = 'other';

              if (
                title.includes('pr') ||
                title.includes('pull request') ||
                title.includes('review')
              ) {
                category = 'pr-review';
              } else if (
                title.includes('test') ||
                title.includes('unit test')
              ) {
                category = 'testing';
              } else if (
                title.includes('rally') ||
                title.includes('sprint') ||
                title.includes('task')
              ) {
                category = 'project-management';
              } else if (title.includes('agent') || title.includes('ai')) {
                category = 'ai-agent';
              }

              return { ...template, category };
            }
          );
          setTemplates(categorizedTemplates);
          setFilteredTemplates(categorizedTemplates);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        console.error('Error loading templates:', err);
        setError('Failed to load templates. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Filter templates based on search query and active tab
  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase().trim();
    let filtered = templates;

    // Filter by category
    if (activeTab !== 'all') {
      filtered = filtered.filter(template => template.category === activeTab);
    }

    // Filter by search query
    if (lowerQuery) {
      filtered = filtered.filter(
        template =>
          template.title.toLowerCase().includes(lowerQuery) ||
          template.content.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredTemplates(filtered);
  }, [searchQuery, templates, activeTab]);

  const handleCopy = useCallback(async (template: Template) => {
    try {
      await navigator.clipboard.writeText(template.content);
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, []);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'pr-review': 'PR Review',
      testing: 'Testing',
      'project-management': 'Project Management',
      'ai-agent': 'AI Agent',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pr-review':
        return <Code2 className='h-3 w-3' />;
      case 'testing':
        return <FileCode className='h-3 w-3' />;
      case 'project-management':
        return <FileText className='h-3 w-3' />;
      case 'ai-agent':
        return <Sparkles className='h-3 w-3' />;
      default:
        return <FileText className='h-3 w-3' />;
    }
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return templates.length;
    return templates.filter(t => t.category === category).length;
  };

  const categories = [
    {
      value: 'all',
      label: 'All Templates',
      icon: <ScrollText className='h-4 w-4' />,
    },
    {
      value: 'ai-agent',
      label: 'AI Agents',
      icon: <Sparkles className='h-4 w-4' />,
    },
    {
      value: 'pr-review',
      label: 'PR Review',
      icon: <Code2 className='h-4 w-4' />,
    },
    {
      value: 'testing',
      label: 'Testing',
      icon: <FileCode className='h-4 w-4' />,
    },
    {
      value: 'project-management',
      label: 'Project Mgmt',
      icon: <FileText className='h-4 w-4' />,
    },
  ];

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto space-y-8'>
          <ToolPageHeader
            title='Prompt Templates'
            description='Browse and copy prompt templates for AI agents, code reviews, testing, and more. Ready-to-use templates for your development workflow.'
            infoMessage='Search through templates by title or content. Click to expand and view the full template. Copy templates with one click.'
            error={error}
          />

          {/* Stats Bar */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            <Card className='border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-lg bg-blue-500/10'>
                    <FileText className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <div>
                    <p className='text-2xl font-bold text-blue-900 dark:text-blue-100'>
                      {templates.length}
                    </p>
                    <p className='text-xs text-blue-700 dark:text-blue-300'>
                      Total Templates
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-lg bg-purple-500/10'>
                    <Sparkles className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                  </div>
                  <div>
                    <p className='text-2xl font-bold text-purple-900 dark:text-purple-100'>
                      {getCategoryCount('ai-agent')}
                    </p>
                    <p className='text-xs text-purple-700 dark:text-purple-300'>
                      AI Agents
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-lg bg-green-500/10'>
                    <Code2 className='h-5 w-5 text-green-600 dark:text-green-400' />
                  </div>
                  <div>
                    <p className='text-2xl font-bold text-green-900 dark:text-green-100'>
                      {getCategoryCount('pr-review')}
                    </p>
                    <p className='text-xs text-green-700 dark:text-green-300'>
                      PR Reviews
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-none shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-lg bg-orange-500/10'>
                    <FileCode className='h-5 w-5 text-orange-600 dark:text-orange-400' />
                  </div>
                  <div>
                    <p className='text-2xl font-bold text-orange-900 dark:text-orange-100'>
                      {getCategoryCount('testing')}
                    </p>
                    <p className='text-xs text-orange-700 dark:text-orange-300'>
                      Testing
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className='border shadow-sm'>
            <CardHeader className='space-y-1 pb-6'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div className='flex items-center gap-3'>
                  <div className='p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10'>
                    <Sparkles className='h-6 w-6 text-primary' />
                  </div>
                  <div>
                    <CardTitle className='text-2xl'>
                      Templates Library
                    </CardTitle>
                    <p className='text-sm text-muted-foreground mt-0.5'>
                      Find and copy templates instantly
                    </p>
                  </div>
                </div>
                <Badge
                  variant='secondary'
                  className='text-sm px-3 py-1.5 w-fit'
                >
                  {filteredTemplates.length} of {templates.length} shown
                </Badge>
              </div>
            </CardHeader>

            <CardContent className='space-y-6'>
              {/* Enhanced Search Input */}
              <div className='relative group'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary' />
                <Input
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder='Search templates by title or content...'
                  className='pl-12 pr-10 h-12 text-base border-2 focus-visible:ring-2 transition-all'
                />
                {searchQuery && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setSearchQuery('')}
                    className='absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                )}
              </div>

              {/* Category Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className='w-full justify-start h-auto flex-wrap gap-2 bg-muted/50 p-2 rounded-xl'>
                  {categories.map(category => (
                    <TabsTrigger
                      key={category.value}
                      value={category.value}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all',
                        'data-[state=active]:bg-background data-[state=active]:shadow-sm'
                      )}
                    >
                      {category.icon}
                      <span className='font-medium'>{category.label}</span>
                      <Badge
                        variant='secondary'
                        className='ml-1 h-5 px-2 text-xs font-semibold'
                      >
                        {getCategoryCount(category.value)}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={activeTab} className='mt-6'>
                  {/* Templates Container */}
                  {isLoading ? (
                    <div className='flex flex-col items-center justify-center py-20 text-muted-foreground'>
                      <div className='relative mb-6'>
                        <div className='absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full' />
                        <Loader2 className='h-14 w-14 animate-spin text-primary relative' />
                      </div>
                      <p className='text-lg font-medium'>
                        Loading templates...
                      </p>
                      <p className='text-sm mt-1'>Please wait a moment</p>
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-20 text-muted-foreground'>
                      <div className='p-6 rounded-2xl bg-muted/50 mb-6'>
                        <Search className='h-14 w-14 opacity-40' />
                      </div>
                      <p className='text-xl font-semibold mb-2'>
                        No templates found
                      </p>
                      <p className='text-sm text-center max-w-md'>
                        Try adjusting your search or category filter to find
                        what you're looking for
                      </p>
                      {searchQuery && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setSearchQuery('')}
                          className='mt-4'
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Accordion type='multiple' className='space-y-3'>
                      {filteredTemplates.map((template, index) => {
                        const isCopied = copiedId === template.id;

                        return (
                          <AccordionItem
                            key={template.id}
                            value={template.id}
                            className={cn(
                              'border-2 rounded-xl overflow-hidden transition-all duration-300',
                              'hover:border-primary/50 hover:shadow-md bg-card',
                              'data-[state=open]:border-primary/50 data-[state=open]:shadow-lg'
                            )}
                            style={{
                              animationDelay: `${index * 50}ms`,
                              animation: 'fadeIn 0.3s ease-out forwards',
                            }}
                          >
                            <AccordionTrigger className='px-6 py-5 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-muted/50 transition-colors group'>
                              <div className='flex items-center gap-4 flex-1 text-left'>
                                <div className='p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary group-hover:scale-110 transition-transform'>
                                  {getCategoryIcon(
                                    template.category || 'other'
                                  )}
                                </div>
                                <div className='flex-1 min-w-0'>
                                  <div className='font-semibold text-base mb-1.5 group-hover:text-primary transition-colors'>
                                    {template.title}
                                  </div>
                                  <div className='flex items-center gap-2 flex-wrap'>
                                    <Badge
                                      variant='outline'
                                      className='text-xs font-medium'
                                    >
                                      {getCategoryLabel(
                                        template.category || 'other'
                                      )}
                                    </Badge>
                                    <span className='text-xs text-muted-foreground'>
                                      {template.content.split('\n').length}{' '}
                                      lines
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>

                            <AccordionContent className='px-6 pb-6 pt-2'>
                              <div className='space-y-4'>
                                {/* Template Preview */}
                                <div className='relative rounded-xl border-2 bg-muted/30 overflow-hidden shadow-inner'>
                                  <div className='absolute top-4 right-4 z-10'>
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleCopy(template);
                                      }}
                                      aria-label={
                                        isCopied
                                          ? 'Copied to clipboard'
                                          : 'Copy to clipboard'
                                      }
                                    >
                                      {isCopied ? (
                                        <Check
                                          className='h-4 w-4'
                                          aria-hidden='true'
                                        />
                                      ) : (
                                        <Copy
                                          className='h-4 w-4'
                                          aria-hidden='true'
                                        />
                                      )}
                                    </Button>
                                  </div>

                                  <ScrollArea className='h-[400px] w-full'>
                                    <pre className='p-6 pr-32 text-sm leading-relaxed font-mono whitespace-pre-wrap break-words'>
                                      {template.content}
                                    </pre>
                                  </ScrollArea>
                                </div>

                                {/* Template Stats */}
                                <div className='flex items-center justify-between p-4 bg-muted/50 rounded-lg'>
                                  <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                                    <div className='flex items-center gap-1.5'>
                                      <FileCode className='h-3.5 w-3.5' />
                                      <span className='font-medium'>
                                        {template.content.split('\n').length}{' '}
                                        lines
                                      </span>
                                    </div>
                                    <span>•</span>
                                    <span className='font-medium'>
                                      {template.content.length.toLocaleString()}{' '}
                                      characters
                                    </span>
                                    <span>•</span>
                                    <span className='font-medium'>
                                      {template.content
                                        .split(' ')
                                        .length.toLocaleString()}{' '}
                                      words
                                    </span>
                                  </div>
                                  <Badge
                                    variant='secondary'
                                    className='text-xs'
                                  >
                                    Markdown
                                  </Badge>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  )}
                </TabsContent>
              </Tabs>

              {/* Info Footer */}
              {!isLoading && filteredTemplates.length > 0 && (
                <div className='mt-8 p-5 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl'>
                  <div className='flex gap-4'>
                    <div className='p-2.5 rounded-xl bg-primary/10 h-fit'>
                      <Info className='h-5 w-5 text-primary' />
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm font-semibold mb-2 text-foreground'>
                        💡 Pro Tips
                      </p>
                      <ul className='text-sm text-muted-foreground space-y-1.5 list-disc list-inside'>
                        <li>
                          Click any template to expand and view its full content
                        </li>
                        <li>
                          Use the search bar to quickly find specific templates
                        </li>
                        <li>
                          Copy button adds templates to your clipboard instantly
                        </li>
                        <li>Filter by category to browse related templates</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </MainLayout>
  );
}
