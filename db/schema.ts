import { integer, pgTable, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const agentsTable = pgTable('agents', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  prompt: text().notNull(),
  tools: jsonb(),
  collectionId: integer(),
  createdAt: timestamp().defaultNow(),
});

export const collectionsTable = pgTable('collections', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  color: varchar({ length: 7 }), // Hex color code
  createdAt: timestamp().defaultNow(),
});
