"use client";

import { BlockMath, InlineMath } from "react-katex";
import { Markdown } from "@/components/ui/markdown";
import type { FlashcardMediaItem } from "@/types/flashcard-platform";
import "katex/dist/katex.min.css";

interface RichFlashcardContentProps {
  content: string;
  media?: FlashcardMediaItem[];
}

function RichText({ content }: { content: string }) {
  const segments = content.split(/(\$\$[\s\S]+?\$\$|\$[^\n$]+?\$)/g);
  return (
    <div className="space-y-3">
      {segments.map((segment, index) => {
        if (segment.startsWith("$$") && segment.endsWith("$$")) {
          return (
            <BlockMath
              key={`${segment}-${index}`}
              math={segment.slice(2, -2)}
            />
          );
        }
        if (segment.startsWith("$") && segment.endsWith("$")) {
          return (
            <InlineMath
              key={`${segment}-${index}`}
              math={segment.slice(1, -1)}
            />
          );
        }
        return segment ? (
          <Markdown
            key={`${segment}-${index}`}
            className="prose prose-neutral dark:prose-invert max-w-none prose-pre:max-w-full prose-pre:overflow-x-auto prose-code:break-words text-current"
          >
            {segment}
          </Markdown>
        ) : null;
      })}
    </div>
  );
}

function MediaItem({ item }: { item: FlashcardMediaItem }) {
  if (item.type === "audio") {
    return (
      <figure className="space-y-2">
        <audio
          className="w-full"
          controls
          preload="metadata"
          aria-label={item.alt ?? "Card audio"}
        >
          <source src={item.src} />
          <track
            kind="captions"
            src={item.captionsSrc}
            srcLang="en"
            label="Captions"
          />
          Your browser does not support audio playback.
        </audio>
        {item.caption ? <figcaption>{item.caption}</figcaption> : null}
      </figure>
    );
  }
  if (item.type === "video") {
    return (
      <figure className="space-y-2">
        <video
          className="max-h-[22rem] w-full rounded-xl bg-muted object-contain"
          controls
          preload="metadata"
          poster={item.poster}
          aria-label={item.alt ?? "Card video"}
        >
          <source src={item.src} />
          <track
            kind="captions"
            src={item.captionsSrc}
            srcLang="en"
            label="Captions"
          />
          Your browser does not support video playback.
        </video>
        {item.caption ? <figcaption>{item.caption}</figcaption> : null}
      </figure>
    );
  }
  return (
    <figure className="space-y-2">
      {/* biome-ignore lint/performance/noImgElement: flashcard media can come from arbitrary trusted deck hosts */}
      <img
        src={item.src}
        alt={item.alt ?? ""}
        className="mx-auto max-h-[22rem] w-auto max-w-full rounded-xl object-contain"
        loading="lazy"
      />
      {item.caption ? <figcaption>{item.caption}</figcaption> : null}
    </figure>
  );
}

export function RichFlashcardContent({
  content,
  media = [],
}: RichFlashcardContentProps) {
  return (
    <div className="mx-auto w-full max-w-[70ch] space-y-5">
      <RichText content={content} />
      {media.length > 0 ? (
        <div className="space-y-4 text-muted-foreground text-xs">
          {media.map((item, index) => (
            <MediaItem key={`${item.type}-${item.src}-${index}`} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
