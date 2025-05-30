import "./rrweb";
import { useEffect, useState } from "react";
import "./App.css";

// Define a Todo type
interface Todo {
  id: string;
  text: string;
}

function App() {
  const [input, setInput] = useState("");
  const [todos, setTodos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem("todos");
    return savedTodos ? JSON.parse(savedTodos) : [];
  });

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const add100RandomTodos = () => {
    const elements: Todo[] = [];
    for (let i = 0; i < 100; i++) {
      elements.push({ id: crypto.randomUUID(), text: crypto.randomUUID() });
    }
    setTodos([...elements, ...todos]);
  };

  const addTodo = () => {
    if (input.trim()) {
      setTodos([{ id: crypto.randomUUID(), text: input }, ...todos]);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
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
        <button onClick={add100RandomTodos}>Add 100 random todos</button>
        {todos.map((todo) => (
          <div className="todo-item" key={todo.id}>
            <span className="todo-text">{todo.text}</span>
            <button
              className="delete-button"
              onClick={() => deleteTodo(todo.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
