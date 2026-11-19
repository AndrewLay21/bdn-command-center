import { integer, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';
export const dashboards = sqliteTable('dashboards', {
 userId: text('user_id').primaryKey(),
 revision: integer('revision').notNull().default(0),
 payload: text('payload').notNull(),
 updatedAt: text('updated_at').notNull()
});

// Claim ownership is separate from portfolio accountability and task acceptance.
export const taskClaims = sqliteTable('task_claims', {
 ownerId:text('owner_id').notNull(), taskId:text('task_id').notNull(),
 runId:text('run_id').notNull(), token:text('token').notNull(),
 generation:integer('generation').notNull(), state:text('state').notNull(),
 heartbeatAt:integer('heartbeat_at').notNull(), expiresAt:integer('expires_at').notNull(),
 lastRequest:text('last_request').notNull(), receipt:text('receipt').notNull()
}, t=>[primaryKey({columns:[t.ownerId,t.taskId]})]);
export const taskClaimEvents = sqliteTable('task_claim_events', {
 ownerId:text('owner_id').notNull(), requestId:text('request_id').notNull(),
 taskId:text('task_id').notNull(), runId:text('run_id').notNull(), action:text('action').notNull(),
 fingerprint:text('fingerprint').notNull(), generation:integer('generation').notNull(),
 at:integer('at').notNull(), receipt:text('receipt').notNull()
}, t=>[primaryKey({columns:[t.ownerId,t.requestId]})]);

export const queueReconciliations=sqliteTable('queue_reconciliations',{
 ownerId:text('owner_id').notNull(),requestId:text('request_id').notNull(),taskId:text('task_id').notNull(),
 overrideJson:text('override_json').notNull(),digest:text('digest').notNull(),fingerprint:text('fingerprint').notNull(),
 evidence:text('evidence').notNull(),runId:text('run_id').notNull(),generation:integer('generation').notNull(),at:integer('at').notNull()
},t=>[primaryKey({columns:[t.ownerId,t.requestId]})]);
