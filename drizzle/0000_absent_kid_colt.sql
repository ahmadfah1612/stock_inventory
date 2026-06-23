CREATE TYPE "public"."txn_type" AS ENUM('buy', 'sell', 'sample', 'scrap');--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand" text NOT NULL,
	"grade" text NOT NULL,
	"unit" text DEFAULT 'Kg' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"date" date NOT NULL,
	"seq" bigserial NOT NULL,
	"type" "txn_type" NOT NULL,
	"doc_no" text,
	"counterparty" text,
	"qty" numeric NOT NULL,
	"unit_cost" numeric,
	"sale_price" numeric,
	"cogs" numeric DEFAULT '0' NOT NULL,
	"revenue" numeric DEFAULT '0' NOT NULL,
	"profit" numeric DEFAULT '0' NOT NULL,
	"bal_qty" numeric DEFAULT '0' NOT NULL,
	"bal_value" numeric DEFAULT '0' NOT NULL,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "materials_brand_grade" ON "materials" USING btree ("brand","grade");