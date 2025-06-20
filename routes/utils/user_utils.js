const DButils = require("./DButils");
const { getRecipeDetails } = require("./recipes_utils");
const axios = require("axios"); // Make sure axios is imported at the top

// TODO: DONE
async function markAsFavorite(user_id, recipe_id) {
    try {
        await DButils.execQuery(
            `INSERT INTO favorite_recipes (user_id, recipe_id) VALUES ('${user_id}', ${recipe_id})`
        );

    } catch (error) {
        console.error('Error marking recipe as favorite:', error);
        throw error;
    }
}
// TODO: DONE
async function getFavoriteRecipes(user_id) {
    try {
        const favorites = await DButils.execQuery(
            `SELECT recipe_id FROM favorite_recipes WHERE user_id = '${user_id}'`
        );
        const recipeIds = favorites.map(f => f.recipe_id);
        const recipes = await Promise.all(
            recipeIds.map(async (id) => {
                try {
                    return await getRecipeDetails(id); // returns from local DB or fetches from Spoonacular
                } catch (err) {
                    console.error(`Failed to load recipe ${id}:`, err.message);
                    return null; // skip if not found
                }
            })
        );

        return recipes.filter(r => r !== null); // remove failed recipes
    } catch (error) {
        console.error("Error getting favorite recipes:", error);
        throw error;
    }
}

// TODO: DONE
async function markAsWatched(user_id, recipe_id) {
    try {
        const exists = await DButils.execQuery(`
      SELECT 1 FROM watched_recipes
      WHERE user_id = ${user_id} AND recipe_id = ${recipe_id}
      LIMIT 1
    `);

        if (exists.length === 0) {
            await DButils.execQuery(`
        INSERT INTO watched_recipes (user_id, recipe_id, watched_at)
        VALUES (${user_id}, ${recipe_id}, NOW())
      `);
        } else {
            // Optional: update the timestamp if needed
            await DButils.execQuery(`
        UPDATE watched_recipes 
        SET watched_at = NOW() 
        WHERE user_id = ${user_id} AND recipe_id = ${recipe_id}
      `);
        }
    } catch (err) {
        console.error("Failed to mark as watched:", err);
        throw err;
    }
}


// TODO: DONE
async function getWatchedRecipes(user_id, limit) {
    const safe_user_id = parseInt(user_id);
    const safe_limit = parseInt(limit);

    const query = `
    SELECT recipe_id 
    FROM watched_recipes 
    WHERE user_id = ${safe_user_id} 
    ORDER BY watched_at DESC 
    LIMIT ${safe_limit}
  `;
    return await DButils.execQuery(query);
}

function escapeString(str) {
    if (typeof str !== "string") return str; // only escape strings
    return str.replace(/'/g, "''").replace(/\n/g, "\\n");
}

async function addRecipe(user_id, title, preparationTime, cuisine, imageUrl, ingredients, instructions, servings) {
     try {
         const query = `
         INSERT INTO recipes (userId, title, ingredients, instructions, imageUrl, preparationTime, cuisine, servings)
         VALUES (
           '${escapeString(user_id)}',
           '${escapeString(title)}',
           '${escapeString(ingredients)}',
           '${escapeString(instructions)}',
           '${escapeString(imageUrl)}',
           ${preparationTime},
           '${escapeString(cuisine)}',
           ${servings}
         )
       `;
         await DButils.execQuery(query);
     } catch (error) {
         console.error("Add recipe error:", error);
         throw error;
    }
 }

// TODO: DONE
async function getRecipe(user_id) {
    const recipes = await DButils.execQuery(
        `SELECT recipeId, title, ingredients, instructions, imageUrl, preparationTime, cuisine, servings, createdAt
       FROM recipes
       WHERE userId = '${user_id}'`
    );
    return recipes;
}

// TODO: NOT TESTED
async function getRecipesPreview(recipesIdsArray) {
    return Promise.all(
        recipesIdsArray.map(async (id) => {
            const r = await getRecipeDetails(id);
            if (!r) {
                console.warn("⚠️ getRecipeDetails failed for ID:", id);
            }
            return r;
        })
    );
}


//TODO : DONE
async function addFamilyRecipe(userId, data) {
    const {
        title,
        ownerName,
        eventOccasion,
        ingredients,
        instructions,
        mainImageUrl,
        familyImages
    } = data;

    const query = `
        INSERT INTO family_recipes (
            userId, title, ownerName, eventOccasion,
            ingredients, instructions, mainImageUrl, familyImages
        ) VALUES (
                     ${userId},
                     '${escapeString(title)}',
                     '${escapeString(ownerName)}',
                     '${escapeString(eventOccasion)}',
                     '${escapeString(JSON.stringify(ingredients))}',
                     '${escapeString(JSON.stringify(instructions))}',
                     '${escapeString(mainImageUrl)}',
                     '${escapeString(JSON.stringify(familyImages))}'
                 )
    `;
    const result = await DButils.execQuery(query);
    return result.insertId;
}

// ✅ NEW FUNCTION
async function getAllWatchedRecipeIds(user_id) {
    const result = await DButils.execQuery(
        `SELECT recipe_id FROM watched_recipes WHERE user_id = ${user_id}`
    );
    return result.map(r => r.recipe_id);
}

// MEAL PLAN UTILS
async function addToMealPlan(user_id, recipe_id) {
    await DButils.execQuery(`
    INSERT INTO meal_plan (user_id, recipe_id)
    VALUES ('${user_id}', ${recipe_id})
    ON DUPLICATE KEY UPDATE recipe_id = recipe_id
  `);
}

async function removeFromMealPlan(user_id, recipe_id) {
    await DButils.execQuery(`
    DELETE FROM meal_plan
    WHERE user_id = '${user_id}' AND recipe_id = ${recipe_id}
  `);
}

async function getMealPlan(user_id) {
    const result = await DButils.execQuery(`
    SELECT recipe_id FROM meal_plan
    WHERE user_id = '${user_id}'
  `);
    return result.map(r => r.recipe_id);
}

exports.getMealPlan =getMealPlan;
exports.removeFromMealPlan =removeFromMealPlan;
exports.addToMealPlan = addToMealPlan;
exports.getAllWatchedRecipeIds = getAllWatchedRecipeIds;
exports.addFamilyRecipe = addFamilyRecipe;
exports.getRecipesPreview = getRecipesPreview;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.markAsWatched = markAsWatched;
exports.getWatchedRecipes = getWatchedRecipes;
exports.addRecipe = addRecipe;
exports.getRecipe = getRecipe;