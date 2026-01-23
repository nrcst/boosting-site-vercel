"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { GalleryDialog } from "@/components/gallery-dialog";
import type { OrderRecord, SessionImageRecord, SessionRecord } from "@/lib/types";

type AdminSession = SessionRecord & { images: SessionImageRecord[] };

const getLocalDateValue = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const getLocalDateTimeValue = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const toLocalDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (val: number) => val.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

const toLocalDateTime = (value?: string | null) => {
  if (!value) return getLocalDateTimeValue();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return getLocalDateTimeValue();
  const pad = (val: number) => val.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoFromDate = (value: string) => {
  if (!value) return null;
  return new Date(`${value}T00:00`).toISOString();
};

const toIsoFromDateTime = (value: string) => {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
};

const getDefaultOrder = () => ({
  order_id: "",
  ign: "",
  customer_name: "",
  uid: "",
  game_type: "",
  service_type: "",
  start_date: getLocalDateValue(),
  due_date: getLocalDateValue(),
  status: "pending",
  profile_screenshot_url: "",
});

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const compressImage = async (file: File) => {
  if (!file.type.startsWith("image/")) return file;

  const maxSize = 1600;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );

    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
};

export function AdminDashboard() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [hideDoneOrders, setHideDoneOrders] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [createOrder, setCreateOrder] = useState(() => getDefaultOrder());
  const [editOrder, setEditOrder] = useState(() => getDefaultOrder());
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [sessionSummary, setSessionSummary] = useState("");
  const [sessionDate, setSessionDate] = useState(getLocalDateTimeValue());
  const [sessionFiles, setSessionFiles] = useState<File[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AdminSession | null>(
    null
  );
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionDialogOrder, setSessionDialogOrder] = useState<OrderRecord | null>(
    null
  );
  const [editSessionSummary, setEditSessionSummary] = useState("");
  const [editSessionDate, setEditSessionDate] = useState(
    getLocalDateTimeValue()
  );
  const [editSessionFiles, setEditSessionFiles] = useState<File[]>([]);
  const [sessionPage, setSessionPage] = useState(1);
  const sessionPageSize = 6;
  const [saving, setSaving] = useState(false);
  const orderPageSize = 10;

  const profilePreview = useMemo(
    () => (profileFile ? URL.createObjectURL(profileFile) : null),
    [profileFile]
  );

  useEffect(() => {
    return () => {
      if (profilePreview) {
        URL.revokeObjectURL(profilePreview);
      }
    };
  }, [profilePreview]);

  const activeOrder = useMemo(
    () => selectedOrder ?? orders[0] ?? null,
    [selectedOrder, orders]
  );

  const visibleOrders = useMemo(() => {
    const filtered = hideDoneOrders
      ? orders.filter((order) => order.status !== "done")
      : orders;
    return [...filtered].sort((a, b) => {
      const aDone = a.status === "done";
      const bDone = b.status === "done";
      if (aDone === bDone) return 0;
      return aDone ? 1 : -1;
    });
  }, [orders, hideDoneOrders]);

  const totalOrderPages = Math.max(1, Math.ceil(visibleOrders.length / orderPageSize));
  useEffect(() => {
    if (orderPage > totalOrderPages) {
      setOrderPage(totalOrderPages);
    }
  }, [orderPage, totalOrderPages]);

  const pagedOrders = visibleOrders.slice(
    (orderPage - 1) * orderPageSize,
    orderPage * orderPageSize
  );

  const totalSessionPages = Math.max(
    1,
    Math.ceil(sessions.length / sessionPageSize)
  );

  useEffect(() => {
    if (sessionPage > totalSessionPages) {
      setSessionPage(totalSessionPages);
    }
  }, [sessionPage, totalSessionPages]);

  const pagedSessions = sessions.slice(
    (sessionPage - 1) * sessionPageSize,
    sessionPage * sessionPageSize
  );

  useEffect(() => {
    void fetchOrders();
  }, []);

  useEffect(() => {
    if (activeOrder) {
      setEditOrder({
        order_id: activeOrder.order_id,
        ign: activeOrder.ign ?? "",
        customer_name: activeOrder.customer_name ?? "",
        uid: activeOrder.uid ?? "",
        game_type: activeOrder.game_type ?? "",
        service_type: activeOrder.service_type ?? "",
        start_date: toLocalDate(activeOrder.start_date),
        due_date: toLocalDate(activeOrder.due_date),
        status: activeOrder.status ?? "pending",
        profile_screenshot_url: activeOrder.profile_screenshot_url ?? "",
      });
      setSessionDate(getLocalDateTimeValue());
      setSessionPage(1);
      void fetchSessions(activeOrder.id);
    }
  }, [activeOrder]);

  useEffect(() => {
    if (selectedSession) {
      setEditSessionSummary(selectedSession.summary ?? "");
      setEditSessionDate(toLocalDateTime(selectedSession.session_date));
    }
  }, [selectedSession]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await fetch("/api/admin/orders");
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Failed to load orders.");
      }
      const payload = await response.json();
      setOrders(payload.orders ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load orders."
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchSessions = async (orderId: string) => {
    setLoadingSessions(true);
    try {
      const response = await fetch(`/api/admin/sessions?orderId=${orderId}`);
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Failed to load sessions.");
      }
      const payload = await response.json();
      setSessions(payload.sessions ?? []);
      setSelectedSession(payload.sessions?.[0] ?? null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load sessions."
      );
    } finally {
      setLoadingSessions(false);
    }
  };

  const uploadFile = async (file: File, orderId?: string) => {
    const optimizedFile = await compressImage(file);
    const data = new FormData();
    data.append("file", optimizedFile);
    if (orderId) {
      data.append("orderId", orderId);
    }

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: data,
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload?.error ?? "Upload failed.");
    }

    const payload = await response.json();
    return payload.url as string;
  };

  const handleCreateOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      let profileUrl = createOrder.profile_screenshot_url;
      if (profileFile) {
        profileUrl = await uploadFile(profileFile, createOrder.order_id);
      }

      const response = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createOrder,
          start_date: toIsoFromDate(createOrder.start_date),
          due_date: toIsoFromDate(createOrder.due_date),
          profile_screenshot_url: profileUrl || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Failed to create order.");
      }

      toast.success("Order created.");
      setCreateOrder(getDefaultOrder());
      setProfileFile(null);
      await fetchOrders();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create order."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeOrder) return;

    setSaving(true);
    try {
      let profileUrl = editOrder.profile_screenshot_url;
      if (profileFile) {
        profileUrl = await uploadFile(profileFile, activeOrder.order_id);
      }

      const response = await fetch(`/api/admin/orders/${activeOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editOrder,
          start_date: toIsoFromDate(editOrder.start_date),
          due_date: toIsoFromDate(editOrder.due_date),
          profile_screenshot_url: profileUrl || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Failed to update order.");
      }

      toast.success("Order updated.");
      setProfileFile(null);
      await fetchOrders();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update order."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSession = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeOrder) return;

    setSaving(true);
    try {
      const uploadedImages = [] as { image_url: string; order_index: number }[];
      for (const [index, file] of sessionFiles.entries()) {
        const url = await uploadFile(file, activeOrder.order_id);
        if (url) {
          uploadedImages.push({ image_url: url, order_index: index });
        }
      }

      const response = await fetch("/api/admin/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: activeOrder.id,
          session_date: toIsoFromDateTime(sessionDate),
          summary: sessionSummary,
          images: uploadedImages,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Failed to add session.");
      }

      toast.success("Session added.");
      setSessionDate(getLocalDateTimeValue());
      setSessionSummary("");
      setSessionFiles([]);
      await fetchSessions(activeOrder.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to add session."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSession = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeOrder || !selectedSession) return;

    setSaving(true);
    try {
      const uploadedImages = [] as { image_url: string; order_index: number }[];
      const baseIndex = selectedSession.images?.length ?? 0;
      for (const [index, file] of editSessionFiles.entries()) {
        const url = await uploadFile(file, activeOrder.order_id);
        if (url) {
          uploadedImages.push({ image_url: url, order_index: baseIndex + index });
        }
      }

      const response = await fetch(
        `/api/admin/sessions/${selectedSession.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_date: toIsoFromDateTime(editSessionDate),
            summary: editSessionSummary,
            images: uploadedImages,
          }),
        }
      );

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Failed to update session.");
      }

      toast.success("Session updated.");
      setEditSessionFiles([]);
      await fetchSessions(activeOrder.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update session."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!activeOrder || !selectedSession) return;
    const confirmed = window.confirm("Delete this session?");
    if (!confirmed) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/sessions/${selectedSession.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Failed to delete session.");
      }
      toast.success("Session deleted.");
      await fetchSessions(activeOrder.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete session."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSessionImage = async (imageId: string) => {
    if (!activeOrder || !selectedSession) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/session-images/${imageId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Failed to delete image.");
      }
      toast.success("Image removed.");
      await fetchSessions(activeOrder.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete image."
      );
    } finally {
      setSaving(false);
    }
  };

  const openSessionDialog = (order: OrderRecord) => {
    setSelectedOrder(order);
    setSessionDialogOrder(order);
    setSelectedSession(null);
    setEditSessionFiles([]);
    setSessionPage(1);
    setSessionDialogOpen(true);
  };

  const closeSessionDialog = (open: boolean) => {
    setSessionDialogOpen(open);
    if (!open) {
      setSessionDialogOrder(null);
      setSelectedSession(null);
      setEditSessionFiles([]);
      setSessionPage(1);
    }
  };

  const handleReorderSessionImages = async (imageIds: string[]) => {
    if (!activeOrder || !selectedSession) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/session-images/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: selectedSession.id,
          image_ids: imageIds,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Failed to reorder images.");
      }

      toast.success("Image order updated.");
      await fetchSessions(activeOrder.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to reorder images."
      );
    } finally {
      setSaving(false);
    }
  };

  const moveImage = (direction: "up" | "down", imageId: string) => {
    if (!selectedSession?.images?.length) return;
    const ids = selectedSession.images.map((image) => image.id);
    const index = ids.indexOf(imageId);
    if (index === -1) return;
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= ids.length) return;
    const reordered = [...ids];
    [reordered[index], reordered[swapWith]] = [
      reordered[swapWith],
      reordered[index],
    ];
    void handleReorderSessionImages(reordered);
  };

  const handleLogout = async () => {
    const response = await fetch("/api/admin/logout", { method: "POST" });
    if (!response.ok) {
      toast.error("Unable to sign out.");
      return;
    }
    window.location.replace("/admin/login");
  };

  const handleHideDoneToggle = () => {
    setHideDoneOrders((prev) => !prev);
    setOrderPage(1);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Delete this order? Sessions and media will be removed permanently.")) {
      return;
    }

    setDeletingOrderId(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Failed to delete order.");
      }

      toast.success("Order deleted.");
      setSelectedOrder((prev) => (prev?.id === orderId ? null : prev));
      await fetchOrders();
      setOrderPage(1);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete order."
      );
    } finally {
      setDeletingOrderId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-300">
            Manage orders, sessions, and media uploads.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={fetchOrders} className="w-full sm:w-auto">
            Refresh
          </Button>
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
            Sign out
          </Button>
        </div>
      </header>

      <Tabs defaultValue="orders">
        <TabsList className="flex w-full flex-col gap-2 bg-slate-900 sm:w-auto sm:flex-row">
          <TabsTrigger value="orders" className="w-full sm:w-auto">
            Orders
          </TabsTrigger>
          <TabsTrigger value="create" className="w-full sm:w-auto">
            Create Order
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <Dialog open={sessionDialogOpen} onOpenChange={closeSessionDialog}>
              <Card className="border-white/10 bg-slate-900/80 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Active Orders
                    </h3>
                    <p className="text-sm text-slate-400">
                      Manage and update order records.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-slate-200">
                      {orders.length} total
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleHideDoneToggle}
                      aria-pressed={hideDoneOrders}
                      className="gap-1 text-sm text-slate-200 hover:text-white"
                    >
                      <Check
                        className={`h-4 w-4 transition ${
                          hideDoneOrders ? "text-emerald-400" : "text-slate-500"
                        }`}
                      />
                      Hide done
                    </Button>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {loadingOrders && (
                    <p className="text-sm text-slate-300">Loading orders...</p>
                  )}
                  {!loadingOrders && visibleOrders.length === 0 && (
                    <p className="text-sm text-slate-300">No orders yet.</p>
                  )}
                  {pagedOrders.map((order) => (
                    <div key={order.id} className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className={`flex-1 min-w-0 rounded-xl border p-4 text-left transition ${
                          activeOrder?.id === order.id
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-white/10 bg-slate-950/60 hover:border-indigo-500/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {order.order_id}
                            </p>
                            <p className="text-xs text-slate-400">
                              {order.game_type ?? "Game"} · {order.service_type ?? "Service"}
                            </p>
                          </div>
                          <Badge className="bg-slate-800 text-slate-200">
                            {order.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </button>
                      <div className="flex flex-col gap-2">
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              openSessionDialog(order);
                            }}
                            className="border-white/10 bg-slate-900/50 text-slate-200 hover:border-indigo-400/60 hover:bg-indigo-500/10 hover:text-white"
                          >
                            Edit Sessions
                          </Button>
                        </DialogTrigger>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteOrder(order.id);
                          }}
                          disabled={deletingOrderId === order.id}
                          className="flex gap-1 border-red-500/30 bg-red-500/10 text-red-200 hover:border-red-400/60 hover:bg-red-500/15 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingOrderId === order.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {visibleOrders.length > orderPageSize && (
                  <Pagination
                    currentPage={orderPage}
                    totalPages={totalOrderPages}
                    onPageChange={setOrderPage}
                    className="mt-4 justify-between"
                  />
                )}
              </Card>

              <DialogContent className="border-white/10 bg-slate-950 text-white sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Edit Sessions</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {sessionDialogOrder
                      ? `Order ${sessionDialogOrder.order_id}`
                      : "Select an order to edit sessions."}
                  </DialogDescription>
                </DialogHeader>
                {activeOrder ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {loadingSessions && (
                        <p className="text-sm text-slate-300">
                          Loading sessions...
                        </p>
                      )}
                      {!loadingSessions && sessions.length === 0 && (
                        <p className="text-sm text-slate-300">
                          No sessions yet.
                        </p>
                      )}
                      <div className="grid gap-2 sm:grid-cols-2">
                        {pagedSessions.map((session) => (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => setSelectedSession(session)}
                            className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                              selectedSession?.id === session.id
                                ? "border-indigo-500 bg-indigo-500/10"
                                : "border-white/10 bg-slate-950/60 hover:border-indigo-500/40"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-slate-400">
                                  {new Date(session.session_date).toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-200">
                                  {session.summary ?? "Session update"}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-slate-200">
                                {session.images?.length ?? 0} images
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                      {sessions.length > sessionPageSize && (
                        <Pagination
                          currentPage={sessionPage}
                          totalPages={totalSessionPages}
                          onPageChange={setSessionPage}
                          className="justify-between"
                        />
                      )}
                    </div>
                    {selectedSession && (
                      <form onSubmit={handleUpdateSession} className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="edit-session-date" className="text-xs text-slate-300">
                            Session Date & Time
                          </label>
                          <Input
                            id="edit-session-date"
                            type="datetime-local"
                            value={editSessionDate}
                            onChange={(event) =>
                              setEditSessionDate(event.target.value)
                            }
                            className="bg-slate-950 text-white"
                          />
                          <p className="text-[11px] text-slate-300">
                            Update the timestamp shown to customers.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="edit-session-summary" className="text-xs text-slate-300">
                            Session Summary
                          </label>
                          <Input
                            id="edit-session-summary"
                            placeholder="Short progress recap"
                            value={editSessionSummary}
                            onChange={(event) =>
                              setEditSessionSummary(event.target.value)
                            }
                            className="bg-slate-950 text-white"
                          />
                          <p className="text-[11px] text-slate-300">Shown in the customer tracker.</p>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="edit-session-files" className="text-xs text-slate-300">
                            Add More Screenshots
                          </label>
                          <Input
                            id="edit-session-files"
                            type="file"
                            multiple
                            onChange={(event) =>
                              setEditSessionFiles(
                                event.target.files
                                  ? Array.from(event.target.files)
                                  : []
                              )
                            }
                            className="bg-slate-950 text-white"
                          />
                          <p className="text-[11px] text-slate-300">New uploads append to the session.</p>
                        </div>
                        {editSessionFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {editSessionFiles.map((file) => (
                              <div
                                key={file.name}
                                className="rounded-md border border-white/10 bg-slate-950 px-2 py-1 text-xs text-slate-300"
                              >
                                {file.name}
                              </div>
                            ))}
                          </div>
                        )}
                        {selectedSession.images?.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs text-slate-300">
                                Existing images (use arrows to reorder)
                              </p>
                              <GalleryDialog
                                session={selectedSession}
                                trigger={
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                  >
                                    Preview Session
                                  </Button>
                                }
                              />
                            </div>
                            <ul className="space-y-2">
                              {selectedSession.images.map((image, idx) => (
                                <li
                                  key={image.id}
                                  className="flex flex-col gap-2 rounded-lg border border-white/10 bg-slate-950/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="relative h-12 w-20 overflow-hidden rounded-md">
                                      <Image
                                        src={image.image_url}
                                        alt="Session preview"
                                        fill
                                        sizes="80px"
                                        unoptimized
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="text-xs text-slate-300">
                                      <div>Image {idx + 1}</div>
                                      <div className="text-[11px] text-slate-300">
                                        {image.image_url.split("/").pop() ?? "Screenshot"}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => moveImage("up", image.id)}
                                      disabled={idx === 0 || saving}
                                    >
                                      Up
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => moveImage("down", image.id)}
                                      disabled={
                                        idx ===
                                          (selectedSession.images?.length ?? 1) - 1 ||
                                        saving
                                      }
                                    >
                                      Down
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        handleDeleteSessionImage(image.id)
                                      }
                                      disabled={saving}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                            {saving ? "Saving..." : "Update Session"}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteSession}
                            disabled={saving}
                            className="w-full sm:w-auto"
                          >
                            Delete Session
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-300">
                    Select an order to edit sessions.
                  </p>
                )}
              </DialogContent>
            </Dialog>

            <div className="space-y-6">
              <Card className="border-white/10 bg-slate-900/80 p-6">
                <h3 className="text-lg font-semibold text-white">
                  Edit Order
                </h3>
                {activeOrder ? (
                  <form onSubmit={handleUpdateOrder} className="mt-4 space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="edit-ign" className="text-xs text-slate-300">
                          In-Game Name (IGN)
                        </label>
                        <Input
                        id="edit-ign"
                        placeholder="e.g. ShadowNexus"
                        value={editOrder.ign}
                        onChange={(event) =>
                          setEditOrder((prev) => ({
                            ...prev,
                            ign: event.target.value,
                          }))
                        }
                        className="bg-slate-950 text-white"
                        />
                        <p className="text-[11px] text-slate-300">Display name shown in game.</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="edit-customer" className="text-xs text-slate-300">
                          Customer Name
                        </label>
                        <Input
                        id="edit-customer"
                        placeholder="e.g. Alex Morgan"
                        value={editOrder.customer_name}
                        onChange={(event) =>
                          setEditOrder((prev) => ({
                            ...prev,
                            customer_name: event.target.value,
                          }))
                        }
                        className="bg-slate-950 text-white"
                        />
                        <p className="text-[11px] text-slate-300">Customer-facing name.</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="edit-uid" className="text-xs text-slate-300">
                          Account UID
                        </label>
                        <Input
                        id="edit-uid"
                        placeholder="e.g. UID-123456"
                        value={editOrder.uid}
                        onChange={(event) =>
                          setEditOrder((prev) => ({
                            ...prev,
                            uid: event.target.value,
                          }))
                        }
                        className="bg-slate-950 text-white"
                        />
                        <p className="text-[11px] text-slate-300">Unique identifier for the player account.</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="edit-game" className="text-xs text-slate-300">
                          Game Type
                        </label>
                        <Input
                        id="edit-game"
                        placeholder="e.g. Ranked Boost"
                        value={editOrder.game_type}
                        onChange={(event) =>
                          setEditOrder((prev) => ({
                            ...prev,
                            game_type: event.target.value,
                          }))
                        }
                        className="bg-slate-950 text-white"
                        />
                        <p className="text-[11px] text-slate-300">Mode or playlist for the boost.</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="edit-service" className="text-xs text-slate-300">
                          Service Type
                        </label>
                        <Input
                        id="edit-service"
                        placeholder="e.g. Division Climb"
                        value={editOrder.service_type}
                        onChange={(event) =>
                          setEditOrder((prev) => ({
                            ...prev,
                            service_type: event.target.value,
                          }))
                        }
                        className="bg-slate-950 text-white"
                        />
                        <p className="text-[11px] text-slate-300">What the customer purchased.</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="edit-start" className="text-xs text-slate-300">
                          Start Date
                        </label>
                        <Input
                        id="edit-start"
                        type="date"
                        value={editOrder.start_date}
                        onChange={(event) =>
                          setEditOrder((prev) => ({
                            ...prev,
                            start_date: event.target.value,
                          }))
                        }
                        className="bg-slate-950 text-white"
                        />
                        <p className="text-[11px] text-slate-300">When the boost started.</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="edit-due" className="text-xs text-slate-300">
                          Due Date
                        </label>
                        <Input
                        id="edit-due"
                        type="date"
                        value={editOrder.due_date}
                        onChange={(event) =>
                          setEditOrder((prev) => ({
                            ...prev,
                            due_date: event.target.value,
                          }))
                        }
                        className="bg-slate-950 text-white"
                        />
                        <p className="text-[11px] text-slate-300">Target delivery date.</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="edit-status" className="text-xs text-slate-300">
                          Order Status
                        </label>
                        <select
                        id="edit-status"
                        value={editOrder.status}
                        onChange={(event) =>
                          setEditOrder((prev) => ({
                            ...prev,
                            status: event.target.value,
                          }))
                        }
                        className="h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                        <p className="text-[11px] text-slate-300">Update when progress changes.</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="edit-profile-url" className="text-xs text-slate-300">
                          Profile Screenshot URL
                        </label>
                        <Input
                        id="edit-profile-url"
                        placeholder="https://..."
                        value={editOrder.profile_screenshot_url}
                        onChange={(event) =>
                          setEditOrder((prev) => ({
                            ...prev,
                            profile_screenshot_url: event.target.value,
                          }))
                        }
                        className="bg-slate-950 text-white"
                        />
                        <p className="text-[11px] text-slate-300">Used on the customer overview banner.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-300">
                        Upload new profile screenshot
                      </label>
                      <Input
                        type="file"
                        onChange={(event) =>
                          setProfileFile(event.target.files?.[0] ?? null)
                        }
                        className="bg-slate-950 text-white"
                      />
                      {profilePreview && (
                        <Image
                          src={profilePreview}
                          alt="Profile preview"
                          width={640}
                          height={256}
                          unoptimized
                          className="mt-2 h-32 w-full rounded-lg object-cover"
                        />
                      )}
                    </div>
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm text-slate-300">
                    Select an order to edit.
                  </p>
                )}
              </Card>

              <Card className="border-white/10 bg-slate-900/80 p-6">
                <h3 className="text-lg font-semibold text-white">
                  Add Session
                </h3>
                {activeOrder ? (
                  <form onSubmit={handleCreateSession} className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="session-date" className="text-xs text-slate-300">
                        Session Date & Time
                      </label>
                      <Input
                        id="session-date"
                        type="datetime-local"
                        value={sessionDate}
                        onChange={(event) => setSessionDate(event.target.value)}
                        className="bg-slate-950 text-white"
                      />
                      <p className="text-[11px] text-slate-300">When the update occurred.</p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="session-summary" className="text-xs text-slate-300">
                        Session Summary
                      </label>
                      <Input
                        id="session-summary"
                        placeholder="Short progress recap"
                        value={sessionSummary}
                        onChange={(event) => setSessionSummary(event.target.value)}
                        className="bg-slate-950 text-white"
                      />
                      <p className="text-[11px] text-slate-300">Shown to the customer in the tracker.</p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="session-files" className="text-xs text-slate-300">
                        Session Screenshots
                      </label>
                      <Input
                        id="session-files"
                        type="file"
                        multiple
                        onChange={(event) =>
                          setSessionFiles(
                            event.target.files
                              ? Array.from(event.target.files)
                              : []
                          )
                        }
                        className="bg-slate-950 text-white"
                      />
                      <p className="text-[11px] text-slate-300">Upload multiple files (compressed automatically).</p>
                    </div>
                    {sessionFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sessionFiles.map((file) => (
                          <div
                            key={file.name}
                            className="rounded-md border border-white/10 bg-slate-950 px-2 py-1 text-xs text-slate-300"
                          >
                            {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                      {saving ? "Uploading..." : "Add Session"}
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm text-slate-300">
                    Select an order to add sessions.
                  </p>
                )}
              </Card>

            </div>
          </div>
        </TabsContent>
        <TabsContent value="create" className="mt-6">
          <Card className="border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-lg font-semibold text-white">Create Order</h2>
            <form onSubmit={handleCreateOrder} className="mt-4 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="create-order-id" className="text-xs text-slate-300">
                    Order ID
                  </label>
                  <Input
                  id="create-order-id"
                  placeholder="e.g. BOOST-1024"
                  value={createOrder.order_id}
                  onChange={(event) =>
                    setCreateOrder((prev) => ({
                      ...prev,
                      order_id: event.target.value,
                    }))
                  }
                  className="bg-slate-950 text-white"
                  required
                />
                  <p className="text-[11px] text-slate-300">Share this with the customer.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="create-ign" className="text-xs text-slate-300">
                    In-Game Name (IGN)
                  </label>
                  <Input
                  id="create-ign"
                  placeholder="e.g. ShadowNexus"
                  value={createOrder.ign}
                  onChange={(event) =>
                    setCreateOrder((prev) => ({
                      ...prev,
                      ign: event.target.value,
                    }))
                  }
                  className="bg-slate-950 text-white"
                />
                  <p className="text-[11px] text-slate-300">Display name shown in game.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="create-customer" className="text-xs text-slate-300">
                    Customer Name
                  </label>
                  <Input
                  id="create-customer"
                  placeholder="e.g. Alex Morgan"
                  value={createOrder.customer_name}
                  onChange={(event) =>
                    setCreateOrder((prev) => ({
                      ...prev,
                      customer_name: event.target.value,
                    }))
                  }
                  className="bg-slate-950 text-white"
                />
                  <p className="text-[11px] text-slate-300">Customer-facing name.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="create-uid" className="text-xs text-slate-300">
                    Account UID
                  </label>
                  <Input
                  id="create-uid"
                  placeholder="e.g. UID-123456"
                  value={createOrder.uid}
                  onChange={(event) =>
                    setCreateOrder((prev) => ({
                      ...prev,
                      uid: event.target.value,
                    }))
                  }
                  className="bg-slate-950 text-white"
                />
                  <p className="text-[11px] text-slate-300">Unique account identifier.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="create-game" className="text-xs text-slate-300">
                    Game Type
                  </label>
                  <Input
                  id="create-game"
                  placeholder="e.g. Ranked Boost"
                  value={createOrder.game_type}
                  onChange={(event) =>
                    setCreateOrder((prev) => ({
                      ...prev,
                      game_type: event.target.value,
                    }))
                  }
                  className="bg-slate-950 text-white"
                />
                  <p className="text-[11px] text-slate-300">Mode or playlist.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="create-service" className="text-xs text-slate-300">
                    Service Type
                  </label>
                  <Input
                  id="create-service"
                  placeholder="e.g. Division Climb"
                  value={createOrder.service_type}
                  onChange={(event) =>
                    setCreateOrder((prev) => ({
                      ...prev,
                      service_type: event.target.value,
                    }))
                  }
                  className="bg-slate-950 text-white"
                />
                  <p className="text-[11px] text-slate-300">What the customer ordered.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="create-start" className="text-xs text-slate-300">
                    Start Date
                  </label>
                  <Input
                  id="create-start"
                  type="date"
                  value={createOrder.start_date}
                  onChange={(event) =>
                    setCreateOrder((prev) => ({
                      ...prev,
                      start_date: event.target.value,
                    }))
                  }
                  className="bg-slate-950 text-white"
                />
                  <p className="text-[11px] text-slate-300">Leave as today if starting now.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="create-due" className="text-xs text-slate-300">
                    Due Date
                  </label>
                  <Input
                  id="create-due"
                  type="date"
                  value={createOrder.due_date}
                  onChange={(event) =>
                    setCreateOrder((prev) => ({
                      ...prev,
                      due_date: event.target.value,
                    }))
                  }
                  className="bg-slate-950 text-white"
                />
                  <p className="text-[11px] text-slate-300">Expected completion date.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="create-status" className="text-xs text-slate-300">
                    Order Status
                  </label>
                  <select
                  id="create-status"
                  value={createOrder.status}
                  onChange={(event) =>
                    setCreateOrder((prev) => ({
                      ...prev,
                      status: event.target.value,
                    }))
                  }
                  className="h-10 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                  <p className="text-[11px] text-slate-300">Customer status indicator.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="create-profile-url" className="text-xs text-slate-300">
                    Profile Screenshot URL
                  </label>
                  <Input
                  id="create-profile-url"
                  placeholder="https://..."
                  value={createOrder.profile_screenshot_url}
                  onChange={(event) =>
                    setCreateOrder((prev) => ({
                      ...prev,
                      profile_screenshot_url: event.target.value,
                    }))
                  }
                  className="bg-slate-950 text-white"
                />
                  <p className="text-[11px] text-slate-300">Optional if uploading file below.</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-300">
                  Upload profile screenshot
                </label>
                <Input
                  type="file"
                  onChange={(event) =>
                    setProfileFile(event.target.files?.[0] ?? null)
                  }
                  className="bg-slate-950 text-white"
                />
                {profilePreview && (
                  <Image
                    src={profilePreview}
                    alt="Profile preview"
                    width={640}
                    height={256}
                    unoptimized
                    className="mt-2 h-32 w-full rounded-lg object-cover"
                  />
                )}
              </div>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? "Creating..." : "Create Order"}
              </Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
