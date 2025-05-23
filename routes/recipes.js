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
// TODO: DONE
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
// TODO: Done
router.post("/", async (req, res, next) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).send("User not authenticated");
    }

    const userId = req.session.user_id;
    const recipeData = req.body;
    const recipeId = await recipes_utils.createRecipe(userId, recipeData);
    res.status(201).send({ id: recipeId });
  } catch (error) {
    next(error);
  }
});

// GET BY ID
// TODO : DONE
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
