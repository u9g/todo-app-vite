import { useEffect, useRef, useState } from "react";
import "./App.css";
import * as rrweb from "rrweb";
import rrwebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css";
import type { eventWithTime } from "@rrweb/types";

function RRWebButtons() {
  const [isRecording, setIsRecording] = useState(false);
  const eventsRef = useRef<eventWithTime[]>([]);

  useEffect(() => {
    if (isRecording) {
      return rrweb.record({
        emit(event) {
          eventsRef.current.push(event);
        },
      });
    } else if (eventsRef.current.length > 0) {
      const events = eventsRef.current;

      eventsRef.current = [];

      const confirm = window.confirm("upload recording to server?");
      if (confirm) {
        fetch("http://64.23.177.109:3000/api/process-recording", {
          method: "POST",
          body: JSON.stringify({
            name: `rrweb-${Date.now().toString()}`,
            events,
          }),
        }).then(() => console.log("uploaded"));
      }
    }
  }, [isRecording]);

  return (
    <>
      <button onClick={() => setIsRecording(!isRecording)}>
        {isRecording ? "Stop recording" : "Record"}
      </button>
    </>
  );
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
    setTodos(todos.filter((_, i) => i !== index));
  };

  return (
    <>
      <div>
        <div>
          <RRWebButtons />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={addTodo}>Add</button>
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
