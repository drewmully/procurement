import { Queue, Worker, type Processor } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
}) as any;

export const inventorySyncQueue = new Queue("inventory-sync", { connection });
export const salesSyncQueue = new Queue("sales-sync", { connection });
export const invoiceParseQueue = new Queue("invoice-parse", { connection });
export const poPdfQueue = new Queue("po-pdf", { connection });
export const alertsQueue = new Queue("alerts", { connection });

export function createWorker<T>(
  queueName: string,
  processor: Processor<T>
): Worker<T> {
  return new Worker<T>(queueName, processor, {
    connection: connection as any,
    concurrency: 1,
  });
}

export { connection };
