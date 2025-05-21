const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const api_key = "52cf84097733427c9e63f65d8cc26f57";

function formatAsList(listOfRecipes) {
    recipes = []
    for (const recipe of listOfRecipes) {
        recipes.push(format(recipe));
    }
    return {
        amount: listOfRecipes.length,
        recipes: recipes
    };
}

function format(recipe_data) {
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_data;

    return {
        id: id,
        recipe: {
            name: title,
            time: readyInMinutes,
            mainImage: image,
            popularity: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            glutenFree: glutenFree
        }
    }
}
/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */

async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: api_key
        }
    });
}

async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
    }
}

async function getAllRecipes() {
    const response = await axios.get(`${api_domain}/random`, {
        params: {
            number: 5, // or any other count
            apiKey: api_key
        }
    });

    // Format preview data
    return response.data.recipes.map(r => ({
        id: r.id,
        title: r.title,
        readyInMinutes: r.readyInMinutes,
        image: r.image,
        popularity: r.aggregateLikes,
        vegan: r.vegan,
        vegetarian: r.vegetarian,
        glutenFree: r.glutenFree
    }));
}

// TODO: TEST THIS FUNCTION
async function searchRecipes({ query, cuisine, diet, intolerance, sort, limit }) {
    try {
        const response = await axios.get(`${api_domain}/complexSearch`, {
            params: {
                query,
                cuisine,
                diet,
                intolerances: intolerance,
                sort,
                number: limit,
                addRecipeInformation: true,
                fillIngredients: true,
                apiKey: api_key
            }
        });

        return response.data.results.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            readyInMinutes: recipe.readyInMinutes,
            image: recipe.image,
            popularity: recipe.aggregateLikes,
            vegan: recipe.vegan,
            vegetarian: recipe.vegetarian,
            glutenFree: recipe.glutenFree,
            instructions: recipe.analyzedInstructions?.[0]?.steps?.map(step => step.step) || [],
            ingredients: recipe.extendedIngredients?.map(ing => ing.original) || []
        }));
    } catch (error) {
        console.error('Error searching recipes:', error);
        throw error;
    }
}

async function getRandomRecipes() {
    let recipes = await axios.get(`${api_domain}/random`, {
        params: {
            includeNutrition: false,
            apiKey: api_key,
            number: 3
        }
    });
    return formatAsList(recipes.data.recipes)
}

const DButils = require("./DButils");

async function createRecipe(userId, recipeData) {
    const result = await DButils.execQuery(
        `INSERT INTO recipes (title, ingredients, instructions, imageUrl, preparationTime, cuisine, servings, userId)
        VALUES ('${recipeData.title}', '${JSON.stringify(recipeData.ingredients)}', '${recipeData.instructions}',
        '${recipeData.imageUrl}', ${recipeData.preparationTime}, '${recipeData.cuisine}', ${recipeData.servings}, ${userId})`
    );
    return result.insertId;
}


async function getRecipesPreview(recipesIdArray) {
    const placeholders = recipesIdArray.map(() => '?').join(',');
    const query = `SELECT id, title, imageUrl, preparationTime FROM recipes WHERE id IN (${placeholders})`;
    const result = await DButils.execQuery(query, recipesIdArray);
    return result;
}

module.exports = {
    createRecipe,
    getRecipeDetails,
    getRandomRecipes,
    getAllRecipes,
    searchRecipes,
    getRecipesPreview
};
