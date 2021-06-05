import { Rect } from "./overlay";

type Message =
  | {
      command: "show-overlay";
    }
  | {
      command: "close-overlay";
    }
  | {
      command: "start-capture";
      rect: Rect;
      innerWidth: number;
      innerHeight: number;
    };

export const sendMessage = ({
  tabId,
  message,
}: {
  tabId?: number;
  message: Message;
}) => {
  if (tabId) {
    chrome.tabs.sendMessage(tabId, message);
  } else {
    chrome.runtime.sendMessage(message);
  }
};

export const onMessage = (
  f: (message: Message, sender?: chrome.runtime.MessageSender) => void
) => {
  chrome.runtime.onMessage.addListener(f);
};
