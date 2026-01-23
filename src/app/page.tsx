import { OrderTracker } from "@/components/order-tracker";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16 lg:px-12">
        <OrderTracker />
      </main>
    </div>
  );
}
