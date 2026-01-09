type Subscriber = (payload: unknown) => void;

const subscribersBySender = new Map<string, Set<Subscriber>>();

export function addSubscriberForSender(senderId: string, subscriber: Subscriber): () => void {
  let set = subscribersBySender.get(senderId);
  if (!set) {
    set = new Set();
    subscribersBySender.set(senderId, set);
  }
  set.add(subscriber);

  return () => {
    const current = subscribersBySender.get(senderId);
    if (!current) return;
    current.delete(subscriber);
    if (current.size === 0) {
      subscribersBySender.delete(senderId);
    }
  };
}

export function publishToSender(senderId: string, payload: unknown): void {
  const set = subscribersBySender.get(senderId);
  if (!set) return;
  for (const subscriber of set) {
    try {
      subscriber(payload);
    } catch (err) {
      console.error("SSE subscriber error for sender", senderId, err);
    }
  }
}
