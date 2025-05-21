var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    try {
      const users = await DButils.execQuery("SELECT user_id FROM users");
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      } else {
        res.status(401).send("User not found");
      }
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).send("Internal server error");
    }
  } else {
    res.status(401).send("Not authenticated");
  }
});

/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */

// TODO: NOT TESTED
router.post('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id, recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
  } catch (error) {
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */

// TODO: NOT TESTED
router.get('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id));
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});

// TODO: NOT TESTED
router.post('/addRecipe', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_name = req.body.name;
    const proccess_time = req.body.proccess_time;
    const vegan_veg = req.body.vegan_veg;
    const gluten = req.body.gluten;
    const image = req.body.image;
    const ingridiants = req.body.ingridiants;
    const instructions = req.body.instructions;
    const numOfPortions = req.body.numOfPortions;
    await user_utils.addRecipe(user_id, recipe_name, proccess_time, vegan_veg, gluten, image, ingridiants, instructions, numOfPortions);
    res.status(200).send("The Recipe successfully added");
  } catch (error) {
    next(error);
  }
});

// TODO: NOT TESTED
router.get('/myRecipes', async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      return res.status(401).send("Not authenticated");
    }
    const recipes = await user_utils.getRecipe(req.session.user_id);
    res.status(200).send(recipes);
  } catch (error) {
    console.error("Error fetching user recipes:", error);
    res.status(500).send("Error fetching recipes");
  }
});

// TODO: NOT TESTED
//This path returns the last watched recipes that were saved by the logged-in user
router.post('/addWatched', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsWatched(user_id, recipe_id);
    res.status(200).send("The Recipe successfully saved as watched");
  } catch (error) {
    next(error);
  }
})

/**
 * This path returns the last watched recipes that were saved by the logged-in user
 */
router.get('/lastWatched', async (req, res, next) => {
  try {
    const recipes_id = await user_utils.getWatchedRecipes(req.session.user_id, req.query.limit);
    recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipeId)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});

module.exports = router;