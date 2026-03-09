type Subscriber = (payload: unknown) => void;

const subscribersBySender = new Map<string, Set<Subscriber>>();

function normalizeSenderId(senderId: string): string {
  return String(senderId ?? "").trim();
}

export function addSubscriberForSender(senderId: string, subscriber: Subscriber): () => void {
  const key = normalizeSenderId(senderId);
  let set = subscribersBySender.get(key);
  if (!set) {
    set = new Set();
    subscribersBySender.set(key, set);
  }
  set.add(subscriber);

  return () => {
    const current = subscribersBySender.get(key);
    if (!current) return;
    current.delete(subscriber);
    if (current.size === 0) {
      subscribersBySender.delete(key);
    }
  };
}

export function publishToSender(senderId: string, payload: unknown): void {
  const key = normalizeSenderId(senderId);
  const set = subscribersBySender.get(key);
  if (!set) return;
  for (const subscriber of set) {
    try {
      subscriber(payload);
    } catch (err) {
      console.error("SSE subscriber error for sender", senderId, err);
    }
  }
}
