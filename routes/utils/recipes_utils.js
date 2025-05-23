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
async function getRecipeDetails(recipeId) {
    const localResult = await DButils.execQuery(`SELECT * FROM recipes WHERE recipeId = ${recipeId}`);
    if (localResult.length > 0) {
        const recipe = localResult[0];
        return {
            id: recipe.recipeId,
            title: recipe.title,
            readyInMinutes: recipe.readyInMinutes,
            image: recipe.imageUrl,
            popularity: recipe.aggregateLikes,
            vegan: recipe.vegan,
            vegetarian: recipe.vegetarian,
            glutenFree: recipe.glutenFree,
            servings: recipe.servings,
            extendedIngredients: JSON.parse(recipe.extendedIngredients || "[]"),
            analyzedInstructions: JSON.parse(recipe.analyzedInstructions || "[]"),
            source: "local"
        };
    }

    try {
        const response = await getRecipeInformation(recipeId);
        const recipe = response.data;
        return {
            id: recipe.id,
            title: recipe.title,
            readyInMinutes: recipe.readyInMinutes,
            image: recipe.image,
            popularity: recipe.aggregateLikes,
            vegan: recipe.vegan,
            vegetarian: recipe.vegetarian,
            glutenFree: recipe.glutenFree,
            servings: recipe.servings,
            extendedIngredients: recipe.extendedIngredients.map(ing => ({
                id: ing.id,
                name: ing.name,
                original: ing.original
            })),
            analyzedInstructions: recipe.analyzedInstructions,
            source: "spoonacular"
        };
    } catch (error) {
        throw { status: 404, message: "Recipe not found in either source" };
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
    const {
        title,
        ingredients,
        instructions,
        imageUrl,
        preparationTime,
        cuisine,
        servings,
        readyInMinutes,
        aggregateLikes,
        vegan,
        vegetarian,
        glutenFree,
        extendedIngredients,
        analyzedInstructions
    } = recipeData;

    const query = `
    INSERT INTO recipes (
      title,
      ingredients,
      instructions,
      imageUrl,
      preparationTime,
      cuisine,
      servings,
      userId,
      createdAt,
      readyInMinutes,
      aggregateLikes,
      vegan,
      vegetarian,
      glutenFree,
      extendedIngredients,
      analyzedInstructions
    ) VALUES (
      '${title}',
      '${JSON.stringify(ingredients)}',
      '${JSON.stringify(instructions)}',
      '${imageUrl}',
      ${preparationTime},
      '${cuisine}',
      ${servings},
      ${userId},
      NOW(),
      ${readyInMinutes},
      ${aggregateLikes},
      ${vegan},
      ${vegetarian},
      ${glutenFree},
      '${JSON.stringify(extendedIngredients)}',
      '${JSON.stringify(analyzedInstructions)}'
    )
  `;

    const result = await DButils.execQuery(query);
    return result.insertId;
}



async function getRecipesPreview(recipesIdArray) {
    if (!recipesIdArray || recipesIdArray.length === 0) return [];

    const safeIds = recipesIdArray.map(id => parseInt(id)).filter(Number.isInteger);
    if (safeIds.length === 0) return [];

    const query = `
        SELECT recipeId AS id, title, imageUrl, preparationTime
        FROM recipes
        WHERE recipeId IN (${safeIds.join(',')})
    `;

    return await DButils.execQuery(query);
}


module.exports = {
    createRecipe,
    getRecipeDetails,
    getRandomRecipes,
    getAllRecipes,
    searchRecipes,
    getRecipesPreview
};
