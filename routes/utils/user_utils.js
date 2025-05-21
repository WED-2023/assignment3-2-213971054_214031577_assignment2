const DButils = require("./DButils");
const { getRecipeDetails } = require("./recipes_utils");

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
        const recipes = await DButils.execQuery(
            `SELECT r.*
         FROM recipes r
         JOIN favorite_recipes f ON r.recipeId = f.recipe_id
         WHERE f.user_id = '${user_id}'`
        );
        return recipes;
    } catch (error) {
        console.error('Error getting favorite recipes:', error);
        throw error;
    }
}


// TODO: DONE
async function markAsWatched(user_id, recipe_id) {
    await DButils.execQuery(
        `INSERT INTO watched_recipes(user_id, recipe_id) VALUES ('${user_id}', ${recipe_id})`
    );
}


// TODO: NOT TESTED
async function getWatchedRecipes(user_id, limit) {
    const recipes_id = await DButils.execQuery(
        `SELECT recipe_id FROM watched_recipes WHERE user_id = ? ORDER BY watched_at DESC LIMIT ?`,
        [user_id, limit]
    );
    return recipes_id;
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



// TODO: NOT TESTED
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
        recipesIdsArray.map(id => getRecipeDetails(id))
    );
}

exports.getRecipesPreview = getRecipesPreview;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.markAsWatched = markAsWatched;
exports.getWatchedRecipes = getWatchedRecipes;
exports.addRecipe = addRecipe;
exports.getRecipe = getRecipe;
