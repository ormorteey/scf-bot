import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";

type MarkdownRendererProps = {
    children: string;
};

function LinkRenderer(props: any) {
    return <a href={props.href} style={{ color: 'blue' }}>{props.children}</a>;
}

export function MarkdownRenderer({ children: markdown }: MarkdownRendererProps) {
    return (
        <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypeRaw, { passThrough: ['element'] }]] as unknown as any}
            components={{
                a: LinkRenderer,
                code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');

                    return !inline && match ? (
                        <SyntaxHighlighter style={dark} PreTag="div" language={match[1]} {...props}>
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    ) : (
                        <code className={className} {...props}>
                            {children}
                        </code>
                    );
                },
            }}
        >
            {markdown}
        </Markdown>
    );
}