CREATE TABLE "collections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "collections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"color" varchar(7),
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "collectionId" integer;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "createdAt" timestamp DEFAULT now();