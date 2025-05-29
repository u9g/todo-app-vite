import { getFiberFromHostInstance, getFiberStack, getDisplayName } from "bippy"; // must be imported BEFORE react
import { useEffect, useRef, useState } from "react";
import "./App.css";
import * as rrweb from "rrweb";
import * as T from "@rrweb/types";

const clicks = new Map<any, number>();

// /**
//  * `instrument` is a function that installs the react DevTools global
//  * hook and allows you to set up custom handlers for react fiber events.
//  */
// instrument(
//   /**
//    * `secure` is a function that wraps your handlers in a try/catch
//    * and prevents it from crashing the app. it also prevents it from
//    * running on unsupported react versions and during production.
//    *
//    * this is not required but highly recommended to provide "safeguards"
//    * in case something breaks.
//    */
//   secure({
//     /**
//      * `onCommitFiberRoot` is a handler that is called when react is
//      * ready to commit a fiber root. this means that react is has
//      * rendered your entire app and is ready to apply changes to
//      * the host tree (e.g. via DOM mutations).
//      */
//     onCommitFiberRoot(rendererID, root) {
//       /**
//        * `traverseRenderedFibers` traverses the fiber tree and determines which
//        * fibers have actually rendered.
//        *
//        * A fiber tree contains many fibers that may have not rendered. this
//        * can be because it bailed out (e.g. `useMemo`) or because it wasn't
//        * actually rendered (if <Child> re-rendered, then <Parent> didn't
//        * actually render, but exists in the fiber tree).
//        */
//       traverseRenderedFibers(root, (fiber) => {
//         /**
//          * `getNearestHostFiber` is a utility function that finds the
//          * nearest host fiber to a given fiber.
//          *
//          * a host fiber for `react-dom` is a fiber that has a DOM element
//          * as its `stateNode`.
//          */
//         // console.log("some node rerendered");

//         const click = clicks.get(fiber.stateNode);
//         if (click !== undefined) {
//           console.log(
//             "a node we are watching rerendered and we are clearing the timeout"
//           );
//           clearTimeout(click);
//           clicks.delete(fiber.stateNode);
//         }

//         // const hostFiber = getNearestHostFiber(fiber);
//         // highlightFiber(hostFiber);
//       });
//     },
//   })
// );

type CustomEvent =
  | {
      name: "clicked-node-not-found";
      data: Record<never, never>;
    }
  | { name: "no-view-change-after-click"; data: { componentStack: string[] } }
  | {
      name: "clicked-without-clicking-on-any-react-component";
      data: Record<never, never>;
    };

function RRWeb() {
  const eventsRef = useRef<T.eventWithTime[]>([]);

  useEffect(() => {
    const { addCustomEvent: _addCustomEvent, mirror } = rrweb.record;
    const addCustomEvent = ({ name, data }: CustomEvent) => {
      console.log("addCustomEvent", name);
      console.log({ size: JSON.stringify(eventsRef.current).length });
      _addCustomEvent(name, data);
    };
    return rrweb.record({
      slimDOMOptions: {
        comment: false,
        headWhitespace: false,
        headFavicon: false,
        headMetaAuthorship: false,
        headMetaDescKeywords: false,
        headMetaHttpEquiv: false,
        headMetaRobots: false,
        headMetaSocial: false,
        headMetaVerification: false,
      },
      emit(event) {
        if (event.type === T.EventType.IncrementalSnapshot) {
          if (event.data.source === T.IncrementalSource.MouseInteraction) {
            if (event.data.type === T.MouseInteractions.Click) {
              console.log("click detected");
              const clickedNode = mirror.getNode(event.data.id);
              if (clickedNode === null) {
                addCustomEvent({ name: "clicked-node-not-found", data: {} });
              }
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
                  clickedNode,
                  setTimeout(() => {
                    addCustomEvent({
                      name: "no-view-change-after-click",
                      data: { componentStack: fiberStackNames },
                    });
                    clicks.delete(clickedNode);
                  }, 2000)
                );
              } else {
                addCustomEvent({
                  name: "clicked-without-clicking-on-any-react-component",
                  data: {},
                });
              }
            }
          } else if (event.data.source === T.IncrementalSource.Mutation) {
            [...clicks.values()].forEach(clearTimeout);
          }
        }
        eventsRef.current.push(event);
      },
    });
  });

  function uploadRecording() {
    const confirm = window.confirm("upload recording to server?");
    if (confirm) {
      const events = eventsRef.current;
      eventsRef.current = [];
      fetch("http://64.23.177.109:3000/api/process-recording", {
        method: "POST",
        body: JSON.stringify({
          events,
        }),
      }).then(() => console.log("uploaded"));
    }
  }

  return <button onClick={uploadRecording}>Upload</button>;
}

function App() {
  const [input, setInput] = useState("");
  const [todos, setTodos] = useState<string[]>(() => {
    const savedTodos = localStorage.getItem("todos");
    return savedTodos ? JSON.parse(savedTodos) : [];
  });

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const add100Todos = () => {
    const elements = [];
    for (let i = 0; i < 100; i++) {
      elements.push(crypto.randomUUID());
    }
    setTodos([...elements, ...todos]);
  };

  const addTodo = () => {
    if (input.trim()) {
      setTodos([input, ...todos]);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const deleteTodo = (index: number) => {
    // setTodos(todos.filter((_, i) => i !== index));
  };

  return (
    <>
      <div>
        <div>
          <RRWeb />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={addTodo}>Add</button>
        <button onClick={add100Todos}>Add 100</button>
        {todos.map((todo, index) => (
          <div className="todo-item" key={index}>
            <span className="todo-text">{todo}</span>
            <button className="delete-button" onClick={() => deleteTodo(index)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
