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

// // TODO: DONE
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

// TODO: DONE
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

// TODO: DONE
/**
 * This path returns the last watched recipes that were saved by the logged-in user
 */
router.get('/lastWatched', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    let limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit <= 0) {
      limit = 3;
    }

    const recipes_id = await user_utils.getWatchedRecipes(user_id, limit);
    const recipes_id_array = recipes_id.map((element) => element.recipe_id);

    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});

//TODO : DONE
router.post("/familyRecipe", async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const id = await user_utils.addFamilyRecipe(userId, req.body);
    res.status(201).send({ message: "familyRecipe added", recipeId: id });
  } catch (error) {
    next(error);
  }
});

//TODO : DONE
router.get("/myFamilyRecipes", async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const result = await DButils.execQuery(
        `SELECT * FROM family_recipes WHERE userId = ${userId}`
    );

    const parsed = result.map(recipe => ({
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients),
      instructions: JSON.parse(recipe.instructions),
      familyImages: JSON.parse(recipe.familyImages || "[]")
    }));

    res.send(parsed);

  } catch (error) {
    next(error);
  }
});

router.get('/watchedIds', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const watchedIds = await user_utils.getAllWatchedRecipeIds(user_id);
    res.status(200).send(watchedIds);
  } catch (error) {
    next(error);
  }
});



// === Meal Plan ===
router.get('/meal-plan', async (req, res, next) => {
  try {
    const recipeIds = await user_utils.getMealPlan(req.user_id);
    const recipes = await Promise.all(
        recipeIds.map(id => recipe_utils.getRecipeDetails(id))
    );
    res.send(recipes);
  } catch (err) {
    next(err);
  }
});

router.post('/meal-plan', async (req, res, next) => {
  try {
    const { recipeId } = req.body;
    await user_utils.addToMealPlan(req.user_id, recipeId);
    res.status(200).send('Added to meal plan');
  } catch (err) {
    next(err);
  }
});

router.delete('/meal-plan/:id', async (req, res, next) => {
  try {
    const recipeId = req.params.id;
    await user_utils.removeFromMealPlan(req.user_id, recipeId);
    res.status(200).send('Removed from meal plan');
  } catch (err) {
    next(err);
  }
});

module.exports = router;