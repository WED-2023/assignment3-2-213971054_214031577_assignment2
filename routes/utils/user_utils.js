const DButils = require("./DButils");

// TODO: NOT WORKING

async function markAsFavorite(user_id, recipe_id) {
    try {
        await DButils.execQuery(
            `INSERT INTO favorite_recipes (user_id, recipe_id) VALUES (?, ?)`,
            [user_id, recipe_id]
        );
    } catch (error) {
        console.error('Error marking recipe as favorite:', error);
        throw error;
    }
}

// TODO: NOT TESTED

async function getFavoriteRecipes(user_id) {
    try {
        const recipes_id = await DButils.execQuery(
            `SELECT recipe_id FROM favorite_recipes WHERE user_id = ?`,
            [user_id]
        );
        return recipes_id;
    } catch (error) {
        console.error('Error getting favorite recipes:', error);
        throw error;
    }
}

// TODO: NOT TESTED
async function markAsWatched(user_id, recipe_id) {
    await DButils.execQuery(`insert into watched_recipes(userId, recipeId) values ('${user_id}',${recipe_id})`);
}

// TODO: NOT TESTED
async function getWatchedRecipes(user_id, limit) { //the limit will be 3 almost all the times
    const recipes_id = await DButils.execQuery(`select recipeId from watched_recipes where userId='${user_id}' order by time desc limit ${limit}`);
    return recipes_id;
}

// TODO: NOT TESTED
async function addRecipe(user_id, recipe_name, proccess_time, vegan_veg, gluten, image, ingridiants, instructions, numOfPortions) {
    await DButils.execQuery(`insert into recipes(userId, name, proccess_time, vegan_veg, gluten, image, ingridiants, instructions, numOfPortions) values ('${user_id}','${recipe_name}','${proccess_time}','${vegan_veg}','${gluten}','${image}','${ingridiants}','${instructions}','${numOfPortions}')`);
}

// TODO: NOT TESTED
async function getRecipe(user_id) {
    const recipes = await DButils.execQuery(`select name,proccess_time,vegan_veg,gluten,image,ingridiants,instructions,numOfPortions from recipes where userId='${user_id}'`);
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
