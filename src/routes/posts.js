const router = require('express').Router();
const auth = require('../middleware/auth');
const Post = require('../mongo/models/Post');

// create post
router.post('/', auth, async (req, res) => {
  const post = await Post.create({
    authorId: req.user.id,
    content: req.body.content,
    images: req.body.images || []
  });
  res.json(post);
});

// list posts (basic feed + optional search)
router.get('/', async (req, res) => {
  const q = req.query.q;
  let filter = {};
  if (q) {
    filter = { content: { $regex: q, $options: 'i' } }; // simple text search
  }
  const posts = await Post.find(filter).sort({ createdAt: -1 }).limit(50);
  res.json(posts);
});

// like
router.post('/:id/like', auth, async (req, res) => {
  const { id } = req.params;
  await Post.updateOne({ _id: id }, { $addToSet: { likes: req.user.id } });
  res.json({ ok: true });
});

// comment
router.post('/:id/comment', auth, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  await Post.updateOne(
    { _id: id },
    { $push: { comments: { userId: req.user.id, content } } }
  );
  res.json({ ok: true });
});

module.exports = router;