// طبقة React Query فوق dbService — تُرجع أشكال الواجهة (camelCase) وتدير التحميل/الإبطال.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as db from "./dbService";
import type { OrderStatus } from "./types";

// ===================== مفاتيح الاستعلام =====================
export const qk = {
  pharmacies: ["pharmacies"] as const,
  availableMeds: ["medications", "available"] as const,
  search: (q: string) => ["medications", "search", q] as const,
  pharmacy: (id: number) => ["pharmacy", id] as const,
  pharmacyInventory: (id: number) => ["pharmacy", id, "inventory"] as const,
  orders: (userId: string) => ["orders", userId] as const,
  pharmacyOrders: (id: number) => ["pharmacyOrders", id] as const,
  notifications: (userId: string) => ["notifications", userId] as const,
};

// ===================== استعلامات (قراءة) =====================

export function useNearbyPharmacies() {
  return useQuery({ queryKey: qk.pharmacies, queryFn: db.getNearbyPharmacies });
}

export function useAvailableMedications() {
  return useQuery({
    queryKey: qk.availableMeds,
    queryFn: db.getAvailableMedications,
  });
}

export function useSearchMedications(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: qk.search(q),
    queryFn: () => db.searchMedications(q),
    enabled: q.length > 0,
  });
}

export function usePharmacy(id: number) {
  return useQuery({
    queryKey: qk.pharmacy(id),
    queryFn: () => db.getPharmacy(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function usePharmacyInventory(id: number) {
  return useQuery({
    queryKey: qk.pharmacyInventory(id),
    queryFn: () => db.getPharmacyInventory(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function usePatientOrders(userId: string | undefined) {
  return useQuery({
    queryKey: qk.orders(userId ?? ""),
    queryFn: () => db.getOrders(userId as string),
    enabled: Boolean(userId),
  });
}

export function usePharmacyOrders(
  pharmacyId: number | null | undefined,
  opts?: { refetchInterval?: number },
) {
  return useQuery({
    queryKey: qk.pharmacyOrders(pharmacyId ?? -1),
    queryFn: () => db.getPharmacyOrders(pharmacyId as number),
    enabled: Boolean(pharmacyId),
    refetchInterval: opts?.refetchInterval,
  });
}

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: qk.notifications(userId ?? ""),
    queryFn: () => db.getNotifications(userId as string),
    enabled: Boolean(userId),
  });
}

// ===================== طفرات (كتابة) =====================

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: db.createOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["pharmacyOrders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      db.updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pharmacyOrders"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useMarkOrderReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => db.markOrderReceived(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["pharmacyOrders"] });
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => db.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useAddCustomInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: db.addCustomInventory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacy"] }),
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number;
      updates: { price?: number; quantity?: number };
    }) => db.updateInventoryItem(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacy"] }),
  });
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => db.deleteInventoryItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacy"] }),
  });
}

export function useUpdatePharmacyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Record<string, unknown> }) =>
      db.updatePharmacyProfile(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacy"] }),
  });
}
