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

// TODO: DONE
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

// TODO: DONE
router.get('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const results = await user_utils.getFavoriteRecipes(user_id); // <-- now returns full recipes
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});

// TODO: DONE
router.post('/addRecipe', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const title = req.body.title;
    const preparationTime = req.body.preparationTime;
    const cuisine = req.body.cuisine;
    const imageUrl = req.body.imageUrl;
    const ingredients = req.body.ingredients;
    const instructions = req.body.instructions;
    const servings = req.body.servings;
    await user_utils.addRecipe(user_id, title, preparationTime, cuisine, imageUrl, ingredients, instructions, servings);
    res.status(200).send("The Recipe successfully added");
  } catch (error) {
    next(error);
  }
});

// TODO: DONE
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
    const user_id = req.session.user_id;
    const limit = req.query.limit;

    const recipes_id = await user_utils.getWatchedRecipes(user_id, limit);
    const recipes_id_array = recipes_id.map((element) => element.recipe_id);

    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});

module.exports = router;