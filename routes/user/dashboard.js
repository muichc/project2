//route to show all the components of the dashboard when user signs in
const express = require('express');
const db = require('../../models');
const isLoggedIn = require('../../middleware/isLoggedIn')
const router = express.Router();

// Routes
router.get('/', isLoggedIn, async (req, res) => {
    try{
        // const recipesForDay = loadRecipesForDay(req); , recipesForEachDay:recipesForDay
        const user = await db.user.findOne({where: {id: req.user.id}, include:[db.recipe]});
        const randomFavorites = getRandomFavorites(user.recipes);
        const favoriteRecipeId = await findFavorites(req);
        const randomRecipes = await loadRandomRecipes(favoriteRecipeId);
        res.render('user/dashboard', {userFavorites:randomFavorites, recipes:randomRecipes, isFavorite: favoriteRecipeId})
    } catch (error){
        res.render('/main/404.ejs', error)
    }
})

// Helper functions for routes

function loadRecipesForDay(req){
    const favoritedByDays = [false, false, false, false, false, false, false];
    db.user.findOne({
        where:{
            id: req.user.id
        }, include:[db.recipe]
    }).then(function(foundUser){
        for (let item in foundUser.recipes) {
            favoritedByDays[(foundUser.recipes[item].dataValues.favorites.dataValues.day)+1]=foundUser.recipes[item]
        }
        return favoritedByDays
    })
    
}

async function loadRandomRecipes(favoriteRecipeId){
    try {
        const randomRecipes = [];
        const recipes = await db.recipe.findAll();
        const randomNumbers = getTwoRandom(recipes.length, favoriteRecipeId);
        for (let item in randomNumbers){
            randomRecipes.push(recipes[randomNumbers[item]]);
        }
        return randomRecipes;
    } catch (error){
        res.render('/main/404.ejs', error)
    }
}

async function findFavorites(req){
    try {
        const favoriteRecipeId=[];
        if(req.user){
            const favorites = await db.favorites.findAll({where:{userId:req.user.id}})
            for (let item in favorites){
                favoriteRecipeId.push(favorites[item].recipeId)
            }
        } 
        return favoriteRecipeId;
    } catch (error){
        res.render('/main/404.ejs', error)
    }
}

function getRandomInt(min, max){
    min = Math.ceil(min);
    max= Math.floor(max);
    return Math.floor(Math.random()*(max-min)+min);
}

// This function gets two random recipes overall but not the ones we have already favorited
function getTwoRandom(max, favoriteRecipeId){
    const randomNumbers= [];
    // Push two random numbers onto the array
    randomNumbers.push(getRandomInt(0,max));
    randomNumbers.push(getRandomInt(0,max));
    // If the random recipe id in index 0 is already in favorites, and if we haven't looped it over a 100 times yet, change the first random number
    let key = 0;
    while(favoriteRecipeId.includes(randomNumbers[0]) && key <= 100) {
        randomNumbers[0]=getRandomInt(0,max);
        key++;
    }
    // If the random recipe id in index 1 is already in favorites or if the first and second number in the array are the same, AND if the number of times we have looped is less than a hundred, change the second random number
    key = 0;
    while((favoriteRecipeId.includes(randomNumbers[1]) || randomNumbers[0]===randomNumbers[1]) && key <= 100){
        randomNumbers[1]=getRandomInt(0,max);
        key++;
    }
    // After the looping, if either of the recipe ids are already favorited, remove them from the array
    if (favoriteRecipeId.includes(randomNumbers[0])) {
        randomNumbers.shift();
    } else if (favoriteRecipeId.includes(randomNumbers[1])) {
        randomNumbers.pop();
    } 
    return randomNumbers;
}

// This function gets two random recipes from the ones I have already favorited
function getRandomFavorites(recipeArray){
    const randomFavorites=[];
    const randomNumbers=[];
    randomNumbers.push(getRandomInt(0,recipeArray.length));
    randomNumbers.push(getRandomInt(0,recipeArray.length));
    while(randomNumbers[0]===randomNumbers[1]) {
        randomNumbers[1]=getRandomInt(0,recipeArray.length);
    }
    for(let item in randomNumbers) {
        randomFavorites.push(recipeArray[randomNumbers[item]]);
    }
    return randomFavorites;
}

module.exports = router;