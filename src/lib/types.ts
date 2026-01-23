export type OrderStatus = "pending" | "in_progress" | "done";

export interface OrderRecord {
  id: string;
  order_id: string;
  ign: string | null;
  customer_name: string | null;
  uid: string | null;
  game_type: string | null;
  service_type: string | null;
  start_date: string | null;
  due_date: string | null;
  status: OrderStatus;
  profile_screenshot_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionRecord {
  id: string;
  order_id: string;
  session_date: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionImageRecord {
  id: string;
  session_id: string;
  image_url: string;
  order_index: number;
}

export interface OrderDetails extends OrderRecord {
  sessions: Array<SessionRecord & { images: SessionImageRecord[] }>;
}
