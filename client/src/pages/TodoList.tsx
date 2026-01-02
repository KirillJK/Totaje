import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/todos', {
        withCredentials: true,
      });
      setTodos(response.data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      await axios.patch(`http://localhost:3000/api/todos/${id}`, {}, {
        withCredentials: true,
      });
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const addTodo = async () => {
    if (newTodoText.trim() === '') return;

    try {
      const response = await axios.post('http://localhost:3000/api/todos',
        { text: newTodoText },
        { withCredentials: true }
      );
      setTodos([...todos, response.data]);
      setNewTodoText('');
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3000/api/todos/${id}`, {
        withCredentials: true,
      });
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading todos...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6">Todo List</h1>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 max-w-2xl">
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a new task..."
              className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
            <button
              onClick={addTodo}
              className="px-4 md:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm md:text-base whitespace-nowrap"
            >
              Add
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {todos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tasks yet. Add one above!</p>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.text}
                className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                />
                <span
                  className={`flex-1 text-sm md:text-base break-words ${
                    todo.completed
                      ? 'line-through text-gray-400'
                      : 'text-gray-800'
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="px-2 md:px-3 py-1 text-xs md:text-sm text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-200">
          <p className="text-xs md:text-sm text-gray-600">
            {todos.filter(t => !t.completed).length} of {todos.length} tasks remaining
          </p>
        </div>
      </div>
    </div>
  );
};

export default TodoList;
