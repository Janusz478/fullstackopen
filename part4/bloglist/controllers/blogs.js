const blogRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')

blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogRouter.post('/', async (request, response) => {
  if (!request.body.title && !request.body.url) return response.status(400).end()

  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!decodedToken.id) return response.status(401).json({ 'error': 'incorrect token' })

  const blog = new Blog({
    author: request.body.author,
    title: request.body.title,
    url: request.body.url,
    likes: request.body.likes || 0,
    user: decodedToken.id
  })
  const savedBlog = await blog.save()

  await User.updateOne({ _id: decodedToken.id }, { $push: { blogs: savedBlog.id } })

  response.status(201).json(savedBlog)
})

blogRouter.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)
  if (!decodedToken.id)
    return response.status(401).json({ 'error': 'incorrect token' })

  const blog = await Blog.findById(request.params.id)

  if (!blog)
    return response.status(204).end()

  if (decodedToken.id != blog.user.toString())
    return response.status(401).json({ 'error': 'only the user who created a blog can delete it' })

  await Blog.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

blogRouter.put('/:id', async (request, response) => {
  const blog = {
    title: request.body.title,
    author: request.body.author,
    url: request.body.url,
    likes: request.body.likes || 0
  }

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
  response.json(updatedBlog)
})

module.exports = blogRouter