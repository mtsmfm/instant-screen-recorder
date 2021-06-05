import { sendMessage, onMessage } from "./message";

let video: HTMLVideoElement | undefined;
let canvas: HTMLCanvasElement | undefined;
let stream: MediaStream | undefined;
let mediaRecorder: MediaRecorder | undefined;
let chunks: Blob[] = [];
let tabId: number | undefined;
let timer: NodeJS.Timer | undefined;

chrome.browserAction.onClicked.addListener((tab) => {
  if (tab.id) {
    if (mediaRecorder) {
      stop();
    } else {
      start();
    }
  }
});

chrome.tabs.onActivated.addListener((info) => {
  stop();

  tabId = info.tabId;
});

chrome.commands.onCommand.addListener(() => {
  if (mediaRecorder) {
    stop();
  } else {
    start();
  }
});

chrome.windows.onFocusChanged.addListener(() => {
  stop();
});

const start = () => {
  if (tabId) {
    sendMessage({ tabId, message: { command: "show-overlay" } });
  }
};

const stop = () => {
  sendMessage({
    tabId,
    message: { command: "close-overlay" },
  });

  if (video) {
    video.remove();
    video = undefined;
  }

  if (canvas) {
    canvas.remove();
    canvas = undefined;
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = undefined;
  }

  if (mediaRecorder) {
    mediaRecorder.onstop = () => {
      if (chunks.length > 0) {
        const blob = new Blob(chunks, {
          type: "video/mp4",
        });
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({ url, filename: "rec.mp4" }, () => {
          chunks = [];
          URL.revokeObjectURL(url);
        });
      }
    };
    mediaRecorder.stop();
    mediaRecorder = undefined;
  }

  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
};

onMessage((message, sender) => {
  if (message.command === "start-capture") {
    const rect = message.rect;

    chrome.tabCapture.capture(
      {
        video: true,
        audio: false,
        videoConstraints: {
          mandatory: {
            minWidth: message.innerWidth,
            maxWidth: message.innerWidth,
            minHeight: message.innerHeight,
            maxHeight: message.innerHeight,
          },
        },
      },
      (s) => {
        if (s) {
          stream = s;

          tabId = sender!.tab!.id!;

          video = document.createElement("video");
          video.srcObject = stream;
          video.play();

          canvas = document.createElement("canvas");
          canvas.width = rect.width;
          canvas.height = rect.height;
          const ctx = canvas.getContext("2d");

          mediaRecorder = new MediaRecorder((canvas as any).captureStream(30), {
            mimeType: "video/webm; codecs=vp9",
          });

          chunks = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };

          timer = setInterval(() => {
            if (ctx && video && canvas) {
              ctx.drawImage(
                video,
                rect.left,
                rect.top,
                canvas.width,
                canvas.height,
                0,
                0,
                canvas.width,
                canvas.height
              );
            }
          }, 1000 / 30);

          (stream as any).oninactive = () => {
            stop();
          };

          mediaRecorder.start();
        }
      }
    );
  }
});
