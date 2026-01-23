"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { GalleryDialog } from "@/components/gallery-dialog";
import { Pagination } from "@/components/ui/pagination";
import type { OrderDetails } from "@/lib/types";

const storageKey = "boosting_order_id";

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-500/20 text-amber-200" },
  in_progress: {
    label: "In Progress",
    className: "bg-sky-500/20 text-sky-200",
  },
  done: { label: "Done", className: "bg-emerald-500/20 text-emerald-200" },
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export function OrderTracker() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const sessions = useMemo(
    () => order?.sessions ?? [],
    [order?.sessions]
  );

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(sessions.length / pageSize));
  const pagedSessions = sessions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const showPagination = totalPages > 1;

  const truncateSummary = (text?: string | null) => {
    if (!text) return "Session update available.";
    if (text.length <= 80) return text;
    return `${text.slice(0, 80)}…`;
  };

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      setOrderId(saved);
      fetchOrder(saved);
    }
    setLoadingSaved(false);
  }, []);

  const fetchOrder = async (id: string) => {
    setLoading(true);
    try {
      const checkResponse = await fetch("/api/orders/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: id }),
      });

      if (!checkResponse.ok) {
        const payload = await checkResponse.json();
        throw new Error(payload?.error ?? "Order not found.");
      }

      const detailsResponse = await fetch(`/api/orders/${id}`, {
        method: "GET",
      });

      if (!detailsResponse.ok) {
        const payload = await detailsResponse.json();
        throw new Error(payload?.error ?? "Unable to load order.");
      }

      const payload = await detailsResponse.json();
      setOrder(payload.order);
      window.localStorage.setItem(storageKey, id);
    } catch (error) {
      setOrder(null);
      window.localStorage.removeItem(storageKey);
      toast.error(
        error instanceof Error ? error.message : "Unable to load order."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orderId.trim()) {
      toast.error("Enter your order ID.");
      return;
    }

    await fetchOrder(orderId.trim());
  };

  const handleTrackAnother = () => {
    setOrder(null);
    setOrderId("");
    setCurrentPage(1);
    window.localStorage.removeItem(storageKey);
    sectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRefresh = () => {
    if (!order?.order_id) return;
    void fetchOrder(order.order_id);
  };

  const handleHeroScroll = () => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-950 via-slate-900 to-indigo-900 p-6 text-white shadow-2xl sm:p-10">
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.35),transparent_60%)]" />
        </div>
        <div className="relative z-10 flex flex-col gap-6">
          <span className="text-xs uppercase tracking-[0.3em] text-indigo-200">
            Boosting Service
          </span>
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl">
            Track your order, see progress updates, and stay informed in real
            time.
          </h1>
          <p className="max-w-2xl text-sm text-indigo-100/80 sm:text-base">
            Premium boosting service with daily progress sessions, secure
            tracking, and dedicated support.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleHeroScroll}
              className="bg-indigo-500 text-white hover:bg-indigo-400"
            >
              Check Your Order
            </Button>
          </div>
        </div>
      </section>

      <section ref={sectionRef} className="space-y-6">
        <Card className="border-white/10 bg-slate-950/60 p-4 shadow-xl sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Order Lookup
                </h2>
                <p className="text-sm text-slate-400">
                  Enter your order ID to view progress.
                </p>
              </div>
              {order && (
                <Button
                  variant="secondary"
                  onClick={handleTrackAnother}
                  className="hidden sm:inline-flex"
                >
                  Track Another
                </Button>
              )}
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 sm:flex-row sm:items-start"
            >
              <Input
                placeholder="Order ID"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                className="bg-slate-900 text-white"
              />
              <div className="flex flex-col gap-3 sm:items-end">
                {order && (
                  <Button
                    variant="secondary"
                    onClick={handleTrackAnother}
                    className="sm:hidden"
                  >
                    Track Another
                  </Button>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? "Checking..." : "Submit"}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        <div
          className={`transition-all duration-500 ${
            order ? "max-h-1250 opacity-100" : "max-h-0 opacity-0"
          } overflow-hidden`}
        >
          <div className="space-y-8">
            {loadingSaved || loading ? (
              <div className="space-y-4">
                <Skeleton className="h-52 w-full" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            ) : order ? (
              <>
                <Card className="overflow-hidden border-white/10 bg-slate-950/80">
                  <div className="relative w-full bg-slate-900">
                    {order.profile_screenshot_url ? (
                      <div className="relative aspect-video w-full">
                        <Image
                          src={order.profile_screenshot_url}
                          alt="Profile screenshot"
                          fill
                          sizes="(min-width: 1024px) 900px, 100vw"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video items-center justify-center text-sm text-slate-400">
                        Profile screenshot placeholder
                      </div>
                    )}
                  </div>
                  <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Account Overview
                      </h3>
                      <p className="text-sm text-slate-400">
                        Latest order details and schedule.
                      </p>
                    </div>
                    <div className="flex items-start justify-start md:justify-end">
                      <Badge
                        className={
                          statusMap[order.status]?.className ??
                          "bg-slate-500/20 text-slate-200"
                        }
                      >
                        {statusMap[order.status]?.label ?? "Pending"}
                      </Badge>
                    </div>
                    <div className="grid gap-3 text-sm text-slate-200">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Customer</span>
                        <span>{order.customer_name ?? "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">IGN</span>
                        <span>{order.ign ?? "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">UID</span>
                        <span>{order.uid ?? "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Game Type</span>
                        <span>{order.game_type ?? "—"}</span>
                      </div>
                    </div>
                    <div className="grid gap-3 text-sm text-slate-200">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Service</span>
                        <span>{order.service_type ?? "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Order ID</span>
                        <span>{order.order_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Start Date</span>
                        <span>{formatDate(order.start_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Due Date</span>
                        <span>{formatDate(order.due_date)}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="border-white/10 bg-slate-950/80 p-4 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Progress Tracking
                      </h3>
                      <p className="text-sm text-slate-400">
                        Newest sessions appear first.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-slate-200">
                        {sessions.length} sessions
                      </Badge>
                      <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={loading}
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    {showPagination && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        className="justify-center"
                      />
                    )}
                    {sessions.length === 0 && (
                      <div className="text-sm text-slate-400">
                        No sessions posted yet. Check back soon.
                      </div>
                    )}
                    {pagedSessions.map((session) => (
                      <GalleryDialog
                        key={session.id}
                        session={session}
                        trigger={
                          <Card className="cursor-pointer border-white/10 bg-slate-900/70 p-4 transition hover:border-indigo-500/60">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm text-slate-400">
                                  {formatDate(session.session_date)}
                                </p>
                                <p className="text-sm text-slate-200">
                                  {truncateSummary(session.summary)}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(session.images ?? []).slice(0, 3).map(
                                  (image) => (
                                    <div
                                      key={image.id}
                                      className="relative w-24 overflow-hidden rounded-md bg-slate-900"
                                    >
                                      <div className="aspect-video w-full">
                                        <Image
                                          src={image.image_url}
                                          alt="Session preview"
                                          fill
                                          sizes="96px"
                                          unoptimized
                                          className="object-cover"
                                        />
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </Card>
                        }
                      />
                    ))}
                  </div>
                </Card>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
