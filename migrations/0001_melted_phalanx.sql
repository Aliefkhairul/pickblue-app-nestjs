CREATE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "verifications_token_hash_idx" ON "verifications" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "verifications_user_id_idx" ON "verifications" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_unique" UNIQUE("order_id");