import type { OrderDetails, OrderRecord, SessionRecord } from "@/lib/types";

const now = new Date().toISOString();

const orders: OrderRecord[] = [
  {
    id: "order-1",
    order_id: "BOOST-1024",
    ign: "ShadowNexus",
    customer_name: "Alex Morgan",
    uid: "UID-998211",
    game_type: "Ranked Boost",
    service_type: "Division Climb",
    start_date: now,
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: "in_progress",
    profile_screenshot_url: "/placeholder.svg",
    created_at: now,
    updated_at: now,
  },
];

const sessions: SessionRecord[] = [
  {
    id: "session-1",
    order_id: "order-1",
    session_date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    summary: "Reached new rank threshold. Solid gains today.",
    created_at: now,
    updated_at: now,
  },
  {
    id: "session-2",
    order_id: "order-1",
    session_date: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    summary: "Daily progress session completed with clean matches.",
    created_at: now,
    updated_at: now,
  },
];

const sessionImages = [
  {
    id: "image-1",
    session_id: "session-1",
    image_url: "/placeholder.svg",
    order_index: 0,
  },
  {
    id: "image-2",
    session_id: "session-1",
    image_url: "/placeholder.svg",
    order_index: 1,
  },
  {
    id: "image-3",
    session_id: "session-2",
    image_url: "/placeholder.svg",
    order_index: 0,
  },
];

const deleteOrder = (id: string) => {
  const orderIndex = orders.findIndex((item) => item.id === id);
  if (orderIndex === -1) return false;
  orders.splice(orderIndex, 1);

  const removedSessionIds: string[] = [];
  for (let i = sessions.length - 1; i >= 0; i -= 1) {
    if (sessions[i].order_id === id) {
      removedSessionIds.push(sessions[i].id);
      sessions.splice(i, 1);
    }
  }

  for (let i = sessionImages.length - 1; i >= 0; i -= 1) {
    if (removedSessionIds.includes(sessionImages[i].session_id)) {
      sessionImages.splice(i, 1);
    }
  }

  return true;
};

const isMock = () => process.env.MOCK_DB === "true";

const findOrderById = (id: string) => orders.find((order) => order.id === id);

export const mockDb = {
  enabled: isMock,
  listOrders: () => orders,
  getOrderByOrderId: (orderId: string) =>
    orders.find((order) => order.order_id === orderId),
  getOrderDetails: (orderId: string): OrderDetails | null => {
    const order = orders.find((item) => item.order_id === orderId);
    if (!order) return null;

    const orderSessions = sessions
      .filter((session) => session.order_id === order.id)
      .sort(
        (a, b) =>
          new Date(b.session_date).getTime() -
          new Date(a.session_date).getTime()
      )
      .map((session) => ({
        ...session,
        images: sessionImages
          .filter((image) => image.session_id === session.id)
          .sort((a, b) => a.order_index - b.order_index),
      }));

    return {
      ...order,
      sessions: orderSessions,
    };
  },
  listSessionsByOrderId: (orderId: string) => {
    return sessions
      .filter((session) => session.order_id === orderId)
      .sort(
        (a, b) =>
          new Date(b.session_date).getTime() -
          new Date(a.session_date).getTime()
      )
      .map((session) => ({
        ...session,
        images: sessionImages
          .filter((image) => image.session_id === session.id)
          .sort((a, b) => a.order_index - b.order_index),
      }));
  },
  createOrder: (payload: Omit<OrderRecord, "id" | "created_at" | "updated_at">) => {
    const created = {
      ...payload,
      id: `order-${crypto.randomUUID()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    orders.unshift(created);
    return created;
  },
  updateOrder: (id: string, payload: Partial<OrderRecord>) => {
    const order = findOrderById(id);
    if (!order) return null;
    Object.assign(order, payload, { updated_at: new Date().toISOString() });
    return order;
  },
  deleteOrder,
  updateSession: (
    id: string,
    payload: { session_date?: string; summary?: string | null }
  ) => {
    const session = sessions.find((item) => item.id === id);
    if (!session) return null;
    Object.assign(session, payload, { updated_at: new Date().toISOString() });
    return session;
  },
  deleteSession: (id: string) => {
    const index = sessions.findIndex((item) => item.id === id);
    if (index === -1) return false;
    sessions.splice(index, 1);
    for (let i = sessionImages.length - 1; i >= 0; i -= 1) {
      if (sessionImages[i].session_id === id) {
        sessionImages.splice(i, 1);
      }
    }
    return true;
  },
  deleteSessionImage: (id: string) => {
    const index = sessionImages.findIndex((item) => item.id === id);
    if (index === -1) return false;
    sessionImages.splice(index, 1);
    return true;
  },
  reorderSessionImages: (sessionId: string, orderedIds: string[]) => {
    const imagesForSession = sessionImages.filter(
      (item) => item.session_id === sessionId
    );
    if (!imagesForSession.length) return false;

    orderedIds.forEach((id, index) => {
      const image = sessionImages.find((item) => item.id === id);
      if (image) {
        image.order_index = index;
      }
    });
    return true;
  },
  createSession: (
    orderId: string,
    payload: { session_date: string; summary: string | null; images?: string[] }
  ) => {
    const order = findOrderById(orderId);
    if (!order) return null;
    const created: SessionRecord = {
      id: `session-${crypto.randomUUID()}`,
      order_id: orderId,
      session_date: payload.session_date,
      summary: payload.summary,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    sessions.unshift(created);
    payload.images?.forEach((url, index) => {
      sessionImages.unshift({
        id: `image-${crypto.randomUUID()}`,
        session_id: created.id,
        image_url: url,
        order_index: index,
      });
    });
    return created;
  },
};
