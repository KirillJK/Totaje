import { Router } from 'express';
import { TodoistApi } from '@doist/todoist-api-typescript';

const router = Router();

const todoist = new TodoistApi(process.env.TODOIST_API_TOKEN || '');

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

router.get('/', requireAuth, async (req: any, res) => {
  try {
    const tasks = await todoist.getTasks();

    const todos = tasks.results.map(task => ({
      id: task.id,
      text: task.content,
      completed: task.checked,
    }));

    res.json(todos);
  } catch (error: any) {
    console.error('Todoist API error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks from Todoist' });
  }
});

router.post('/', requireAuth, async (req: any, res) => {
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const task = await todoist.addTask({
      content: text.trim(),
    });

    const newTodo = {
      id: task.id,
      text: task.content,
      completed: task.checked,
    };

    res.status(201).json(newTodo);
  } catch (error: any) {
    console.error('Todoist API error:', error);
    res.status(500).json({ error: 'Failed to create task in Todoist' });
  }
});

router.patch('/:id', requireAuth, async (req: any, res) => {
  const taskId = req.params.id;

  try {
    const task = await todoist.getTask(taskId);

    if (task.checked) {
      await todoist.reopenTask(taskId);
    } else {
      await todoist.closeTask(taskId);
    }

    const updatedTask = await todoist.getTask(taskId);

    const todo = {
      id: updatedTask.id,
      text: updatedTask.content,
      completed: updatedTask.checked,
    };

    res.json(todo);
  } catch (error: any) {
    console.error('Todoist API error:', error);
    res.status(500).json({ error: 'Failed to update task in Todoist' });
  }
});

router.delete('/:id', requireAuth, async (req: any, res) => {
  const taskId = req.params.id;

  try {
    await todoist.deleteTask(taskId);
    res.status(204).send();
  } catch (error: any) {
    console.error('Todoist API error:', error);
    res.status(500).json({ error: 'Failed to delete task from Todoist' });
  }
});

export default router;
