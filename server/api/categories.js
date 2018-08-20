const router = require('express').Router();
const { Category, Topic, Question, User, UserTopic } = require('../db/models');
const Op = require('sequelize').Op;
module.exports = router;

// get all categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.findAll({ include: [Topic] });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// get all topics in all categories you are interested in
router.get('/topics', async (req, res, next) => {
  try {
    const userTopics = await UserTopic.findAll({
      where: { userId: req.user.dataValues.id },
      attributes: ['topicId'],
      include: [{ model: Topic, attributes: ['categoryId'] }]
    });

    if (userTopics.length === 0) {
      return res.json([]);
    } else {
      const categoryIds = userTopics.map(item => item.topic.categoryId);
      const userTopicIds = userTopics.map(item => item.topicId);
      const topics = await Topic.findAll({
        where: {
          categoryId: { [Op.or]: categoryIds },
          id: { [Op.notIn]: userTopicIds }
        }
      });
      res.json(topics);
    }
  } catch (err) {
    next(err);
  }
});

// get a specific category
router.get('/:categoryId', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.categoryId, {
      include: [Topic]
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// create a category
router.post('/', async (req, res, next) => {
  try {
    const newCategory = await Category.create({
      name: req.body.name
    });
    res.status(201).json(newCategory);
  } catch (err) {
    next(err);
  }
});

// get all questions in a category
router.get('/:categoryId/questions', async (req, res, next) => {
  try {
    if (!req.query.type || req.query.type === 'newest') {
      const questions = await Question.findAll({
        where: { categoryId: req.params.categoryId },
        include: [{ model: Topic }, { model: User }],
        order: [['createdAt', 'DESC']]
      });
      res.json(questions);
    } else if (req.query.type === 'answered') {
      const inactiveQuestions = await Question.findAll({
        where: { categoryId: req.params.categoryId, isActive: false },
        include: [{ model: Topic }, { model: User }],
        order: [['createdAt', 'DESC']]
      });
      res.json(inactiveQuestions);
    }
  } catch (err) {
    next(err);
  }
});
