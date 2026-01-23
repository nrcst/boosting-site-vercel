"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import type { OrderDetails } from "@/lib/types";

interface GalleryDialogProps {
  session: OrderDetails["sessions"][number];
  trigger: React.ReactNode;
  initialIndex?: number;
}

export function GalleryDialog({ session, trigger, initialIndex = 0 }: GalleryDialogProps) {
  const images = useMemo(() => session.images ?? [], [session.images]);
  const [index, setIndex] = useState(initialIndex);
  const [api, setApi] = useState<CarouselApi>();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const current = useMemo(() => images[index], [images, index]);

  const handleFullscreen = async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await containerRef.current.requestFullscreen();
  };

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setIndex(api.selectedScrollSnap());
    };
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  useEffect(() => {
    api?.scrollTo(0);
  }, [api, session.id]);

  useEffect(() => {
    api?.scrollTo(initialIndex);
  }, [api, initialIndex]);


  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[92vw] max-w-5xl bg-slate-950 text-white">
        <VisuallyHidden>
          <DialogTitle>Session gallery</DialogTitle>
        </VisuallyHidden>
        <div ref={containerRef} className="space-y-4">
          {isFullscreen && (
            <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-black p-4">
              <div className="flex items-center justify-end gap-2 text-xs text-slate-200">
                <span>Tap image again to close</span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleFullscreen}
                  className="rounded-full"
                >
                  Close
                </Button>
              </div>
              <div
                className="mt-3 flex flex-1 items-center justify-center overflow-auto touch-pan-x touch-pan-y"
                onClick={handleFullscreen}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleFullscreen();
                }}
              >
                {current && (
                  <Image
                    src={current.image_url}
                    alt="Session screenshot"
                    width={1920}
                    height={1080}
                    sizes="100vw"
                    unoptimized
                    className="h-auto w-full max-w-none object-contain"
                  />
                )}
              </div>
            </div>
          )}
          <div>
            <h4 className="text-lg font-semibold">Session Details</h4>
            <p className="text-sm text-slate-300">
              {session.summary ?? "Session update details."}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
            {current ? (
              <Carousel setApi={setApi} opts={{ loop: true }} className="relative">
                <CarouselContent>
                  {images.map((image) => (
                    <CarouselItem key={image.id}>
                      <div
                        className="relative w-full overflow-hidden rounded-lg bg-black/40 aspect-video"
                        onClick={handleFullscreen}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleFullscreen();
                        }}
                      >
                        <Image
                          src={image.image_url}
                          alt="Session screenshot"
                          fill
                          sizes="(min-width: 1024px) 800px, 90vw"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-4 bg-slate-950/90 text-white hover:bg-slate-800" />
                <CarouselNext className="-right-4 bg-slate-950/90 text-white hover:bg-slate-800" />
              </Carousel>
            ) : (
              <div className="flex aspect-video items-center justify-center text-sm text-slate-400">
                No screenshots for this session.
              </div>
            )}
          </div>
          <p className="text-xs text-slate-300">
            Click the image to toggle fullscreen.
          </p>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((image, imageIndex) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => api?.scrollTo(imageIndex)}
                  className={`h-16 w-24 overflow-hidden rounded-md border transition ${
                    imageIndex === index
                      ? "border-indigo-400"
                      : "border-transparent"
                  }`}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={image.image_url}
                      alt="Session thumbnail"
                      fill
                      sizes="96px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
