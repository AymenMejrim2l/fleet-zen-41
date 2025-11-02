interface QueuedAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

const QUEUE_KEY = "offline_queue";

export const offlineQueue = {
  add: (type: string, data: any) => {
    const queue = offlineQueue.getAll();
    const action: QueuedAction = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
    };
    queue.push(action);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return action.id;
  },

  getAll: (): QueuedAction[] => {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  remove: (id: string) => {
    const queue = offlineQueue.getAll().filter((item) => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  clear: () => {
    localStorage.removeItem(QUEUE_KEY);
  },

  process: async (processor: (action: QueuedAction) => Promise<void>) => {
    const queue = offlineQueue.getAll();
    
    for (const action of queue) {
      try {
        await processor(action);
        offlineQueue.remove(action.id);
      } catch (error) {
        console.error("Error processing queued action:", error);
      }
    }
  },
};
