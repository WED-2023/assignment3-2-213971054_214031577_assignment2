var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

// GET ALL
router.get("/", async (req, res, next) => {
  try {
    const recipes = await recipes_utils.getAllRecipes();
    res.send(recipes);
  } catch (error) {
    next(error);
  }
});

// GET 3 random recipes
router.get("/random", async (req, res, next) => {
  try {
    const recipes = await recipes_utils.getRandomRecipes();
    res.send(recipes);
  } catch (error) {
    next(error);
  }
});


// SEARCH

// TODO: NOT TESTED
router.get("/search", async (req, res, next) => {
  try {
    const {
      query,
      cuisine,
      diet,
      intolerance,
      sort,
      limit = 5
    } = req.query;

    const results = await recipes_utils.searchRecipes({ query, cuisine, diet, intolerance, sort, limit });
    res.send(results);
  } catch (error) {
    next(error);
  }
});

// CREATE

// TODO: NOT WORKING
router.post("/", async (req, res, next) => {
  try {
    const userResult = await require("./utils/DButils").execQuery(`SELECT id FROM users WHERE username = 'testuser'`);
    const userId = userResult[0].id;
    const recipeData = req.body;
    const recipeId = await recipes_utils.createRecipe(userId, recipeData);
    res.status(201).send({ id: recipeId });
  } catch (error) {
    next(error);
  }
});

// GET BY ID
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
