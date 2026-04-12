// components/primitives/MarkdownRenderer.tsx
import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { ComponentPropsWithoutRef } from "react";


type Props = {
    content: string;
};

// Properly typed components
const markdownComponents: Components = {
    h1: ({ node, ...props }) => (
        <h1 className="text-2xl font-semibold mt-4 mb-2" {...props} />
    ),
    h2: ({ node, ...props }) => (
        <h2 className="text-xl font-semibold mt-4 mb-2" {...props} />
    ),
    h3: ({ node, ...props }) => (
        <h3 className="text-lg font-semibold mt-3 mb-2" {...props} />
    ),
    p: ({ node, ...props }) => (
        <p className="text-sm leading-relaxed mb-3 text-zap-ink" {...props} />
    ),
    ul: ({ node, ...props }) => (
        <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />
    ),
    ol: ({ node, ...props }) => (
        <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />
    ),
    li: ({ node, ...props }) => (
        <li className="text-sm" {...props} />
    ),
    strong: ({ node, ...props }) => (
        <strong className="font-semibold" {...props} />
    ),

    // ✅ Correctly typed code block
    code({
        inline,
        className,
        children,
        ...props
    }: ComponentPropsWithoutRef<"code"> & { inline?: boolean }) {
        if (inline) {
            return (
                <code
                    className="rounded bg-zap-bg px-1.5 py-0.5 font-mono text-xs"
                    {...props}
                >
                    {children}
                </code>
            );
        }

        return (
            <pre className="rounded-xl bg-zap-bg-raised p-4 overflow-x-auto mb-4">
                <code className={`font-mono text-xs ${className || ""}`} {...props}>
                    {children}
                </code>
            </pre>
        );
    },

    a: ({ node, ...props }) => (
        <a
            className="text-zap-brand underline hover:opacity-80"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
        />
    ),
};

const MarkdownRenderer: React.FC<Props> = ({ content }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize, rehypeHighlight]}
            components={markdownComponents}
        >
            {content}
        </ReactMarkdown>
    );
};

export default MarkdownRenderer;