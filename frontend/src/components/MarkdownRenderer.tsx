import React from 'react';
import { motion } from 'framer-motion';

interface MarkdownRendererProps {
  text: string;
  streaming?: boolean;
  streamingColor?: string; // tailwind bg class, e.g. 'bg-core-purple'
}


/**
 * Parses a line to determine its type and content.
 */
function parseLine(line: string): {
  type: 'h2' | 'h3' | 'bullet' | 'numbered' | 'blank' | 'text';
  content: string;
  level?: number;
} {
  // Heading: ## or ###
  const h3Match = line.match(/^###\s+(.*)/);
  if (h3Match) return { type: 'h3', content: h3Match[1].replace(/\*+/g, '').trim() };
  const h2Match = line.match(/^##\s+(.*)/);
  if (h2Match) return { type: 'h2', content: h2Match[1].replace(/\*+/g, '').trim() };

  // Bullet: - or * or •
  const bulletMatch = line.match(/^[-*•]\s+(.*)/);
  if (bulletMatch) return { type: 'bullet', content: bulletMatch[1] };

  // Numbered list: 1. 2. etc
  const numberedMatch = line.match(/^\d+\.\s+(.*)/);
  if (numberedMatch) return { type: 'numbered', content: numberedMatch[1] };

  // Blank
  if (line.trim() === '') return { type: 'blank', content: '' };

  // Plain text (may have **bold** inline)
  return { type: 'text', content: line };
}

/** Render inline bold: **text** → <strong> */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="text-slate-300 italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function MarkdownRenderer({
  text,
  streaming = false,
  streamingColor = 'bg-core-purple',
}: MarkdownRendererProps) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  let bulletGroup: string[] = [];
  let numberedGroup: { content: string; num: number }[] = [];
  let numCounter = 1;

  const flushBullets = (key: string) => {
    if (bulletGroup.length === 0) return;
    elements.push(
      <ul key={`ul-${key}`} className="flex flex-col gap-2 pl-1 my-1">
        {bulletGroup.map((item, bi) => (
          <li key={bi} className="flex items-start gap-3">
            <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-core-purple shrink-0" />
            <span className="text-slate-300 text-sm leading-relaxed">
              {renderInline(item)}
            </span>
          </li>
        ))}
      </ul>
    );
    bulletGroup = [];
  };

  const flushNumbered = (key: string) => {
    if (numberedGroup.length === 0) return;
    elements.push(
      <ol key={`ol-${key}`} className="flex flex-col gap-2 pl-1 my-1">
        {numberedGroup.map(({ content, num }, ni) => (
          <li key={ni} className="flex items-start gap-3">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-core-purple/20 border border-core-purple/40 flex items-center justify-center text-[10px] font-bold text-core-purple shrink-0">
              {num}
            </span>
            <span className="text-slate-300 text-sm leading-relaxed">
              {renderInline(content)}
            </span>
          </li>
        ))}
      </ol>
    );
    numberedGroup = [];
    numCounter = 1;
  };

  lines.forEach((rawLine, idx) => {
    const parsed = parseLine(rawLine);

    if (parsed.type === 'bullet') {
      flushNumbered(`pre-bullet-${idx}`);
      bulletGroup.push(parsed.content);
    } else if (parsed.type === 'numbered') {
      flushBullets(`pre-num-${idx}`);
      numberedGroup.push({ content: parsed.content, num: numCounter++ });
    } else {
      // Flush any pending lists before emitting the next element
      flushBullets(`b-${idx}`);
      flushNumbered(`n-${idx}`);

      if (parsed.type === 'h2') {
        elements.push(
          <h2
            key={`h2-${idx}`}
            className="text-base font-bold text-white tracking-tight mt-4 mb-1 first:mt-0 flex items-center gap-2"
          >
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-core-purple to-core-cyan shrink-0" />
            {parsed.content}
          </h2>
        );
      } else if (parsed.type === 'h3') {
        elements.push(
          <h3
            key={`h3-${idx}`}
            className="text-sm font-semibold text-slate-200 tracking-wide uppercase mt-3 mb-1 first:mt-0"
          >
            {parsed.content}
          </h3>
        );
      } else if (parsed.type === 'blank') {
        // small spacer, but not a <br> every line
        elements.push(<div key={`blank-${idx}`} className="h-1" />);
      } else {
        // plain text
        elements.push(
          <p key={`p-${idx}`} className="text-slate-300 text-sm leading-relaxed">
            {renderInline(parsed.content)}
          </p>
        );
      }
    }
  });

  // Flush any remaining lists at end
  flushBullets('end-b');
  flushNumbered('end-n');

  return (
    <div className="flex flex-col gap-1.5">
      {elements}
      {streaming && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className={`inline-block w-2 h-4 ${streamingColor} rounded-sm ml-1 align-middle`}
        />
      )}
    </div>
  );
}
