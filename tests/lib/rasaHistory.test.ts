import { describe, expect, it } from "vitest";
import { mapRasaTrackerEvents, type RasaHistoryEvent } from "@/lib/rasaHistory";

describe("mapRasaTrackerEvents", () => {
  it("hides user messages with an empty ui_display_text", () => {
    const events: RasaHistoryEvent[] = [
      {
        event: "user",
        text: "/greet",
        metadata: {
          source: "thread-bootstrap",
          synthetic: true,
          ui_display_text: "",
        },
      },
      {
        event: "bot",
        text: "Hello",
      },
    ];

    expect(mapRasaTrackerEvents(events)).toEqual([
      {
        role: "assistant",
        text: "Hello",
        buttons: undefined,
        feedbackKey: "bot:1",
      },
    ]);
  });

  it("uses a non-empty ui_display_text for user messages", () => {
    const events: RasaHistoryEvent[] = [
      {
        event: "user",
        text: "/button_payload",
        metadata: {
          ui_display_text: "Clicked button",
        },
      },
    ];

    expect(mapRasaTrackerEvents(events)).toEqual([
      {
        role: "user",
        text: "Clicked button",
        rawText: "/button_payload",
      },
    ]);
  });
});