"use client";

import { Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <div className="bg-muted relative overflow-hidden rounded-md text-sm">
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: "transparent",
          padding: "1rem",
        }}
        codeTagProps={{ style: { fontSize: "0.875rem" } }}
      >
        {code}
      </SyntaxHighlighter>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        onClick={() => {
          navigator.clipboard.writeText(code);
          toast.success("Copied to clipboard");
        }}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
