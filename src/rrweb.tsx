import * as rrweb from "rrweb";
import * as T from "@rrweb/types";
import { getFiberFromHostInstance, getFiberStack, getDisplayName } from "bippy"; // must be imported BEFORE react

const clicks = new Map<Element, number>();

// Rage click detection state
let lastClick = 0;
let secondLastClick = 0;
let totalClicks = 0;
const rageThreshold = 6;

export type CustomEvent =
  | {
      name: "clicked-node-not-found";
      data: Record<never, never>;
    }
  | { name: "no-view-change-after-click"; data: { componentStack: string[] } }
  | {
      name: "dom-mutation";
      data: Record<never, never>;
    }
  | {
      name: "clicked-without-clicking-on-any-react-component";
      data: Record<never, never>;
    }
  | {
      name: "rage-click";
      data: { componentStack: string[]; totalClicks: number };
    }
  | {
      name: "media-load-error";
      data: { componentStack: string[]; url: string };
    }
  | {
      name: "rage-click-with-no-react-fiber";
      data: { totalClicks: number };
    };

const events: T.eventWithTime[] = [];
const { addCustomEvent: _addCustomEvent, mirror } = rrweb.record;

const addCustomEvent = ({ name, data }: CustomEvent) => {
  if (name !== "dom-mutation") console.log("addCustomEvent", name);
  _addCustomEvent(name, data);
};

rrweb.record({
  // slimDOMOptions: {
  //   comment: false,
  //   headWhitespace: false,
  //   headFavicon: false,
  //   headMetaAuthorship: false,
  //   headMetaDescKeywords: false,
  //   headMetaHttpEquiv: false,
  //   headMetaRobots: false,
  //   headMetaSocial: false,
  //   headMetaVerification: false,
  // },
  emit(event) {
    if (event.type === T.EventType.IncrementalSnapshot) {
      if (event.data.source === T.IncrementalSource.MouseInteraction) {
        if (event.data.type === T.MouseInteractions.Click) {
          console.log("click detected");
          const clickedNode = mirror.getNode(event.data.id);

          // Rage click detection logic
          totalClicks++;
          if (totalClicks > rageThreshold) {
            totalClicks = 1; // Reset to 1 since we just had a click
          }

          const now = Math.floor(Date.now());

          // Detect rage click
          if (clickedNode) {
            if (
              now - lastClick < 500 &&
              now - secondLastClick < 1000 &&
              totalClicks >= rageThreshold
            ) {
              const fiber = getFiberFromHostInstance(clickedNode);

              if (fiber !== null) {
                const fiberStack = getFiberStack(fiber);
                const fiberStackNames = fiberStack.map((f) => {
                  const displayName = getDisplayName(f);
                  if (displayName !== null) return displayName;

                  const className = f.pendingProps.className;
                  if (typeof className === "string") {
                    return `${f.elementType}.${className.split(" ").join(".")}`;
                  }

                  return f.elementType;
                });
                addCustomEvent({
                  name: "rage-click",
                  data: { componentStack: fiberStackNames, totalClicks },
                });
                uploadRecording("Quick Repeated Clicks");
              } else {
                addCustomEvent({
                  name: "rage-click-with-no-react-fiber",
                  data: { totalClicks },
                });
              }
            }
          }

          secondLastClick = lastClick;
          lastClick = now;

          // Original click handling logic
          if (clickedNode === null) {
            addCustomEvent({ name: "clicked-node-not-found", data: {} });
          } else {
            const fiber = getFiberFromHostInstance(clickedNode);
            if (fiber !== null) {
              const fiberStack = getFiberStack(fiber);
              const fiberStackNames = fiberStack.map((f) => {
                const displayName = getDisplayName(f);
                if (displayName !== null) return displayName;

                const className = f.pendingProps.className;
                if (typeof className === "string") {
                  return `${f.elementType}.${className.split(" ").join(".")}`;
                }

                return f.elementType;
              });
              clicks.set(
                clickedNode as Element,
                setTimeout(() => {
                  addCustomEvent({
                    name: "no-view-change-after-click",
                    data: { componentStack: fiberStackNames },
                  });
                  uploadRecording("No dom mutation after click");
                  clicks.delete(clickedNode as Element);
                }, 2000)
              );
            } else {
              addCustomEvent({
                name: "clicked-without-clicking-on-any-react-component",
                data: {},
              });
            }
          }
        }
      } else if (event.data.source === T.IncrementalSource.Mutation) {
        [...clicks.values()].forEach(clearTimeout);
        clicks.clear();
        addCustomEvent({
          name: "dom-mutation",
          data: {},
        });
        return;
      }
    }
    events.push(event);
  },
});

// put this once, as early as possible (e.g. in index.js or _app.tsx)
function handleResourceError({
  target: el,
}: {
  target: EventTarget & HTMLElement;
}) {
  if (
    el instanceof HTMLImageElement ||
    el instanceof HTMLVideoElement ||
    el instanceof HTMLAudioElement ||
    el instanceof HTMLSourceElement
  ) {
    // Everything you need is on the element itself
    const src = "currentSrc" in el ? el.currentSrc : el.src;
    const fiber = getFiberFromHostInstance(el);
    if (fiber !== null) {
      const fiberStack = getFiberStack(fiber);
      const fiberStackNames = fiberStack.map((f) => {
        const displayName = getDisplayName(f);
        if (displayName !== null) return displayName;

        const className = f.pendingProps.className;
        if (typeof className === "string") {
          return `${f.elementType}.${className.split(" ").join(".")}`;
        }

        return f.elementType;
      });
      addCustomEvent({
        name: "media-load-error",
        data: {
          componentStack: fiberStackNames,
          url: src,
        },
      });
      uploadRecording("Media Load Error");
    }
  }
}

window.addEventListener(
  "error",
  handleResourceError as any,
  /* useCapture = */ true
);

let timeout: ReturnType<typeof setTimeout> | null = null;

async function uploadRecording(reason: string) {
  if (timeout !== null) return;
  timeout = setTimeout(() => {
    timeout = null;
  }, 10000);
  await fetch("http://64.23.177.109:3000/api/process-recording", {
    method: "POST",
    body: JSON.stringify({
      events,
    }),
  })
    .then((x) => x.text())
    .then((x) =>
      alert(
        `New bug analyzed.\nClient Reason: ${reason}\nServer Response: ${x}`
      )
    );
}
