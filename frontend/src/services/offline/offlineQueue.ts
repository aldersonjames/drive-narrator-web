export interface OfflineJob {
  id: string;
  endpoint: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export class OfflineQueue {
  private readonly storageKey = 'trip-narrator-offline-queue';

  constructor(private readonly getNow: () => string = () => new Date().toISOString()) {}

  enqueue(endpoint: string, payload: Record<string, unknown>): OfflineJob {
    const job: OfflineJob = {
      id: `job-${Date.now()}`,
      endpoint,
      payload,
      createdAt: this.getNow(),
    };
    const next = [...this.readQueue(), job];
    this.writeQueue(next);
    return job;
  }

  dequeue(): OfflineJob | undefined {
    const queue = this.readQueue();
    const job = queue.shift();
    this.writeQueue(queue);
    return job;
  }

  peek(): OfflineJob | undefined {
    return this.readQueue()[0];
  }

  clear(): void {
    this.writeQueue([]);
  }

  private readQueue(): OfflineJob[] {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return [];
      return JSON.parse(raw) as OfflineJob[];
    } catch (error) {
      console.warn('Failed to read offline queue', error);
      return [];
    }
  }

  private writeQueue(queue: OfflineJob[]): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to persist offline queue', error);
    }
  }
}
