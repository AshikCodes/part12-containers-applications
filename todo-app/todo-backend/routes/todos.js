const express = require('express');
const { Todo } = require('../mongo/index');
const { getAsync, setAsync } = require('../redis');
const router = express.Router();

/* GET todos listing. */
router.get('/', async (_, res) => {
  const todos = await Todo.find({})
  res.send(todos);
});

router.get('/statistics', async (_, res) => {
  const added_todos = await getAsync("added_todos") === null ? await Todo.collection.countDocuments() : await getAsync("added_todos")
  res.json({ added_todos });
});

/* POST todo to listing. */
router.post('/', async (req, res) => {
  const todo = await Todo.create({
    text: req.body.text,
    done: false
  })
  const collections = await getAsync('added_todos') === null ? await Todo.collection.countDocuments() : await getAsync('added_todos') + 1;
  await setAsync('added_todos', collections)
  console.log(`collections here is ${collections}`)
  res.send(todo);
});

const singleRouter = express.Router();

const findByIdMiddleware = async (req, res, next) => {
  const { id } = req.params
  req.todo = await Todo.findById(id)
  if (!req.todo) return res.sendStatus(404)

  next()
}

/* DELETE todo. */
singleRouter.delete('/', async (req, res) => {
  await req.todo.delete()  
  res.sendStatus(200);
});

/* GET todo. */
singleRouter.get('/', async (req, res) => {
  const todo = req.todo
  res.json(todo)
});

/* PUT todo. */
singleRouter.put('/', async (req, res) => {
  const body = req.body;
  const todo = { ...body };
  const updatedTodo = await Todo.findByIdAndUpdate(req.todo._id,todo,{new: true});
  console.log(`updatedTodo here is ${updatedTodo}`)
  res.json(updatedTodo)
});

router.use('/:id', findByIdMiddleware, singleRouter)


module.exports = router;
