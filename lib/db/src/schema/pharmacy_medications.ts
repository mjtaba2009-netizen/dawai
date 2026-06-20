import { pgTable, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { pharmaciesTable } from "./pharmacies";
import { medicationsTable } from "./medications";

export const pharmacyMedicationsTable = pgTable("pharmacy_medications", {
  id: serial("id").primaryKey(),
  pharmacyId: integer("pharmacy_id").notNull().references(() => pharmaciesTable.id),
  medicationId: integer("medication_id").notNull().references(() => medicationsTable.id),
  price: real("price").notNull(),
  quantity: integer("quantity").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPharmacyMedicationSchema = createInsertSchema(pharmacyMedicationsTable).omit({ id: true, updatedAt: true });
export type InsertPharmacyMedication = z.infer<typeof insertPharmacyMedicationSchema>;
export type PharmacyMedication = typeof pharmacyMedicationsTable.$inferSelect;
