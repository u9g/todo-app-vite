import "./rrweb";
import { useEffect, useState } from "react";
import "./App.css";

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
    setTodos(todos.filter((_, i) => i !== index));
  };

  return (
    <>
      <div>
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
