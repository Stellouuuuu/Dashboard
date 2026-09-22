import { Queue, QueueEvents } from "bullmq";
import { getRedis } from "../database/client.js";
import { CONSTANTS } from "../config/constants.js";

let widgetQueue: Queue | null = null;

export function getWidgetQueue(): Queue {
  if (!widgetQueue) {
    widgetQueue = new Queue(CONSTANTS.WIDGET_QUEUE_NAME, {
      connection: getRedis(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    });
  }
  return widgetQueue;
}
