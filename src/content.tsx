import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { onMessage, sendMessage } from "./message";
import { Overlay } from "./overlay";

let root: HTMLDivElement;

const showOverlay = () => {
  if (!root) {
    root = document.createElement("div");
    document.body.appendChild(root);
  }

  render(
    <Overlay
      onEndSelect={(rect, innerWidth, innerHeight) => {
        sendMessage({
          message: { command: "start-capture", rect, innerWidth, innerHeight },
        });
      }}
    />,
    root
  );
};

const closeOverlay = () => {
  unmountComponentAtNode(root);
};

onMessage(({ command }) => {
  switch (command) {
    case "show-overlay": {
      showOverlay();
      break;
    }
    case "close-overlay": {
      closeOverlay();
      break;
    }
  }
});
