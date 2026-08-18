// src/components/ErrorHighlight.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { AlertCircle, CheckCircle2, CornerDownRight } from "lucide-react";

interface ErrorHighlightSpanProps {
  type: "grammar" | "vocabulary" | "spelling" | "cohesion";
  original: string;
  correction: string;
  explanation: string;
  onApply?: (original: string, correction: string) => void;
}

export function ErrorHighlightSpan({
  type,
  original,
  correction,
  explanation,
  onApply,
}: ErrorHighlightSpanProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close tooltip on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Map types to styling colors
  const typeConfigs = {
    grammar: {
      class: "error-highlight-grammar",
      badgeBg: "bg-red-100 text-red-700 border-red-200",
      accentColor: "text-red-500",
      title: "Ngữ Pháp",
    },
    vocabulary: {
      class: "error-highlight-vocabulary",
      badgeBg: "bg-orange-100 text-orange-700 border-orange-200",
      accentColor: "text-orange-500",
      title: "Từ Vựng",
    },
    spelling: {
      class: "error-highlight-spelling",
      badgeBg: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accentColor: "text-yellow-600",
      title: "Chính Tả",
    },
    cohesion: {
      class: "error-highlight-cohesion",
      badgeBg: "bg-blue-100 text-blue-700 border-blue-200",
      accentColor: "text-blue-500",
      title: "Mạch Lạc",
    },
  };

  const config = typeConfigs[type] || typeConfigs.grammar;

  return (
    <span className="relative inline">
      <span
        ref={triggerRef}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className={`${config.class} inline cursor-help px-0.5 rounded-sm`}
      >
        {original}
      </span>

      {/* Tooltip Popup */}
      {isOpen && (
        <span
          ref={tooltipRef}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-900 text-slate-100 p-4 rounded-xl shadow-2xl border border-slate-700/80 text-xs font-sans leading-normal block normal-case whitespace-normal text-left"
        >
          {/* Header */}
          <span className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${config.badgeBg}`}>
              {config.title}
            </span>
            <AlertCircle className={`w-4 h-4 ${config.accentColor}`} />
          </span>

          {/* Details */}
          <span className="block mb-2 font-semibold text-slate-300">
            Cụm từ gốc: <span className="line-through text-slate-500 font-mono">{original}</span>
          </span>

          <span className="block mb-3">
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CornerDownRight className="w-3.5 h-3.5" />
              Gợi ý sửa:
            </span>
            <span className="block mt-1 font-mono font-bold text-slate-100 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
              {correction}
            </span>
          </span>

          <span className="block text-slate-400 mb-3 leading-relaxed">
            <strong className="text-slate-300 block mb-0.5">Giải thích:</strong>
            {explanation}
          </span>

          {/* Click to Apply (if editor is active) */}
          {onApply && (
            <button
              onClick={() => {
                onApply(original, correction);
                setIsOpen(false);
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Áp dụng sửa nhanh
            </button>
          )}

          {/* Tiny Arrow pointer */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></span>
        </span>
      )}
    </span>
  );
}

// Global Parser function to transform tagged XML feedback string into React Element nodes
export function renderTaggedEssay(
  rawText: string,
  onApplyCorrection?: (original: string, correction: string) => void
): React.ReactNode[] {
  if (!rawText) return [];

  const regex = /<error\s+type="([^"]+)"\s+correction="([^"]+)"\s+explanation="([^"]+)">([\s\S]*?)<\/error>/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyCount = 0;

  // Clone string to make sure regex runs from start
  const textToParse = rawText;

  while ((match = regex.exec(textToParse)) !== null) {
    const matchIndex = match.index;

    // Push plain text prior to match
    if (matchIndex > lastIndex) {
      elements.push(
        <React.Fragment key={`text-${keyCount++}`}>
          {textToParse.substring(lastIndex, matchIndex)}
        </React.Fragment>
      );
    }

    const [, type, correction, explanation, originalText] = match;

    elements.push(
      <ErrorHighlightSpan
        key={`err-${keyCount++}`}
        type={type as any}
        original={originalText}
        correction={correction}
        explanation={explanation}
        onApply={onApplyCorrection}
      />
    );

    lastIndex = regex.lastIndex;
  }

  // Push remainder text
  if (lastIndex < textToParse.length) {
    elements.push(
      <React.Fragment key={`text-${keyCount++}`}>
        {textToParse.substring(lastIndex)}
      </React.Fragment>
    );
  }

  return elements;
}
