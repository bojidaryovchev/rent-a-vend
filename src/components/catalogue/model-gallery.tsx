"use client";

import { useState } from "react";
import Image from "next/image";
import { MachineImage, type MachineShape } from "@/components/ui/machine-image";
import { PHOTO_VIEW_LABEL, type Category } from "@/content/taxonomy";
import type { Photo } from "@/content/schema";
import { cn } from "@/lib/cn";

/**
 * The machine's photography, and what stands there until it exists.
 *
 * With no photos this is the dimensioned drawing, unchanged - the fallback is
 * the whole point, because 62 models will not be shot in one afternoon and the
 * catalogue has to stay honest and shippable in between. Landing a set is
 * dropping files into `public/machines/<slug>/` and adding a line each; nothing
 * here changes.
 *
 * Frames are contained rather than cropped. The site's claim is that these are
 * measured objects, and a cropped machine is a machine whose proportions you
 * cannot read - the one thing a buyer comparing a 701mm Snakky against a 1180mm
 * Merchant is actually looking for.
 *
 * There used to be a second mode here, for combination machines: two frames
 * side by side, captioned as the two halves of a pair. A combo turned out to be
 * one cabinet - a coffee machine standing on a snack base - and is photographed
 * as one, so the mode described a product that is not in the catalogue.
 */
export function ModelGallery({
  photos,
  category,
  name,
  shape,
  className,
}: {
  photos: Photo[];
  category: Category;
  name: string;
  shape?: MachineShape;
  className?: string;
}) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <MachineImage
        category={category}
        name={name}
        shape={shape}
        showNote
        className={className}
      />
    );
  }

  // A stale index cannot outlive the photo list on a client transition.
  const current = photos[Math.min(active, photos.length - 1)];

  return (
    <div className={cn("flex flex-col", className)}>
      <figure className="relative flex min-h-0 flex-1 flex-col border border-line bg-paper-sunken">
        <div className="paper-grain relative min-h-64 flex-1">
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain p-4"
            /* Above the fold on every machine page. `priority` is deprecated in
               Next 16; the docs point at these two instead. */
            loading="eager"
            fetchPriority="high"
          />
          <span className="serial absolute top-0 left-0 bg-graphite px-2 py-1 text-paper/80">
            {PHOTO_VIEW_LABEL[current.view]}
          </span>
        </div>

        {current.credit && (
          <figcaption className="relative border-t border-line bg-paper-raised px-3 py-2">
            <span className="serial text-ink-subtle">{current.credit}</span>
          </figcaption>
        )}
      </figure>

      {photos.length > 1 && (
        <div
          className="mt-2 grid grid-cols-4 gap-2"
          role="group"
          aria-label={`Изгледи на ${name}`}
        >
          {photos.map((photo, i) => {
            const isActive = photo === current;
            return (
              <button
                key={photo.src}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={isActive}
                className={cn(
                  "relative aspect-4/3 border bg-paper-sunken transition-colors duration-200",
                  isActive
                    ? "border-graphite"
                    : "border-line hover-fine:border-line-strong",
                )}
              >
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-contain p-1.5"
                />
                <span className="sr-only">
                  {PHOTO_VIEW_LABEL[photo.view]} - {photo.alt}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
