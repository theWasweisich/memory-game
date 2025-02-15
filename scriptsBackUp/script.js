

class DevTools {
    static flipAll() {
        memoryCards.forEach(card => {
            card.flipped = !card.flipped;
        });
        gameState.performFlips();
    }

    static toggleDevMode() {
        isDevModeActive = !isDevModeActive;

        if (!isDevModeActive) {
            gameState.setShadowHint(null, null);
        }

        /** @type {HTMLButtonElement} */
        let turnBtn;
        for (const card of memoryCards) {
            turnBtn = card.element?.querySelector(".cheatdisplay");
            if (isDevModeActive) {
                turnBtn.innerText += " " + card.pairId.toString();
            } else {
                turnBtn.innerText = turnBtn.dataset.default;
            }
        }
    }
}

class GameState {
    flippedCards;
    matchedPairs;
    gameLocked;
    constructor() {
        this.flippedCards = [];
        this.matchedPairs = [];
        this.gameLocked = false;
    }

    /**
    * 
    * @param {MemoryCardData} card 
    */
    flipCard(card) {
        if (this.gameLocked || this.flippedCards.includes(card) || card.guessed) {
            return;
        }

        card.element?.classList.add("flipped");
        card.flipped = true;
        this.flippedCards.push(card);

        if (this.flippedCards.length >= 2) {
            this.setShadowHint(null, null);
            this.checkForMatch();
        } else {
            if (isDevModeActive) {
                for (const card_ of memoryCards) {
                    if (card_.pairId === card.pairId) {
                        this.setShadowHint(card_, card);
                    }
                }
            }
        }

        this.revealCard(card);
    }

    /**
     * 
     * @param {MemoryCardData} card1 
     * @param {MemoryCardData} card2 
     */
    setShadowHint(card1, card2) {
        if (card1 === null || card2 === null) {
            throw Error("Element is null!")
        }
        if (card1.element === null || card2.element === null) {
            throw Error("Element is null!")
        }
        let shadowValue = "black 0 0 5px";
        try {
            if (card1 === undefined || card2 === undefined) {
                for (const card of memoryCards) {
                    if (card.element === null) {
                        continue
                    }
                    card.element.style.boxShadow = "none";
                }
                return;
            }
            if ((card1.flipped || card2.flipped) && isDevModeActive) {
                card1.element.style.boxShadow = shadowValue;
                card2.element.style.boxShadow = shadowValue;
            } else {
                card1.element.style.boxShadow = "none";
                card2.element.style.boxShadow = "none";            
            }
        } catch (e) {
            return
        }
    }

    /**
     * 
     * @param {MemoryCardData} card 
    */
    revealCard(card) {
        if (!card.flipped && !card.guessed) {
            console.error("Card is not flipped!");
            return;
        }
        if (card.element === null) {
            throw Error("Card element is null")
        }
        (card.element.querySelector("img")).src = String(card.image);
    }

    checkForMatch() {
        /** @type {MemoryCardData[]} */
        const [card1, card2] = this.flippedCards;
        // console.debug(card1, card2);

        // console.debug("IDs: ", card1.pairId, card2.pairId);
        if (card1.pairId === card2.pairId) {
            this.#onMatchFound(card1, card2);
        } else {
            this.gameLocked = true;
            this.#setCursorStyle("not-allowed");
            setTimeout(() => {
                this.resetFlippedCards();
                this.nextTurn();
                this.gameLocked = false;
                this.#setCursorStyle("pointer");
            }, 1000);
        }
    }

    #setCursorStyle(style) {
        for (const card of memoryCards) {
            if (card.element === null) {
                throw Error("Card element is null")
            }
            card.element.style.cursor = style;
        }
    }

    /**
     * 
     * @param {MemoryCardData} card1 
     * @param {MemoryCardData} card2 
     */
    #onMatchFound(card1, card2) {
        this.matchedPairs.push(card1.pairId);
        card1.guessed = true;
        card2.guessed = true;
        this.flippedCards = [];
        this.#setCardsStyle(card1, card2, "background-color", this.getCurrentPlayer().color);
        this.#setCardsStyle(card1, card2, "filter", "opacity(0.5)");
        this.getCurrentPlayer().incrementScore();
        this.checkGameOver();
    }

    /**
     * 
     * @param {MemoryCardData} card1 
     * @param {MemoryCardData} card2
     * @param {string} property 
     * @param {string} value 
     */
    #setCardsStyle(card1, card2, property, value) {
        card1.element.style.setProperty(property, value);
        card2.element.style.setProperty(property, value);
    }

    resetFlippedCards() {
        this.flippedCards.forEach(card => { card.flipped = false });
        this.performFlips();
        this.flippedCards = [];
        this.gameLocked = false;
    }


    performFlips() {
        memoryCards.forEach(card => {
            if (card.element === null) {
                throw Error("Card element is null")
            }
            if (card.flipped) {
                // card.element.classList.add("flipped");
                (card.element.querySelector("img")).src = card.image;
            } else {
                // card.element.classList.remove("flipped");
                (card.element.querySelector("img")).src = defaultImage.src;
            }
        })
    }


    getUnflippedCards() {
        return memoryCards.filter(card => !card.flipped);
    }

    nextTurn() {
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (player.isTurn) {
                this.getNextPlayer().toggleTurn(true);
                player.toggleTurn(false);
                return
            }
        }
    }

    getNextPlayer() {
        if (players.length === 1) {
            return players[0]
        }
        for (let i = 0; i < players.length; i++) {
            if (players[i].isTurn) {
                if (i + 1 == players.length) {
                    return players[0];
                } else {
                    return players[i + 1];
                }
            }
        }
        throw Error();
    }

    getCurrentPlayer() {
        for (const player of players) {
            if (player.isTurn) {
                return player;
            }
        }
        throw Error();
    }

    checkGameOver() {
        if (this.getUnflippedCards().length <= 0) {
            console.log("Game over!");
            let winner = this.#getWinner();
            setTimeout(() => {
                alert(`${winner} hat gewonnen!`);
                // this.restartGame();
            }, 1500);
        }
    }

    /**
     * 
     * @returns {string} The players name
     */
    #getWinner() {
        let maxGuesses = 0;
        let winner = undefined;
        for (const player of players) {
            if (player.getScore() > maxGuesses) {
                maxGuesses = player.getScore();
                winner = player.name;
            }
        }
        if (winner === undefined) {
            throw Error("Irgendwas ist doof");
        }
        return winner;
    }

    restartGame() {
        window.location.reload();
    }
}


class MemoryCardData {

    pairId;
    image;
    flipped;
    element;
    guessed;
    /**
     * 
     * @param {number} pairId 
     * @param {URL} image 
     * @param {boolean} flipped 
     * @param {HTMLDivElement} element
     * @param {boolean} guessed
    */

    constructor(pairId, image, flipped, element) {
        /** @type {number} */
        this.pairId = pairId;

        /** @type {URL} */
        this.image = image;

        /** @type {boolean} */
        this.flipped = flipped;

        /** @type {HTMLDivElement} */
        this.element = element ? element : null;

        /** @type {boolean} */
        this.guessed = false;
    }

    getPair() {
        for (const card of memoryCards) {
            if (card.pairId === this.pairId) {
                return card;
            }
        };
    }
}

class Player {
    name;
    color;
    isTurn;
    scoreBoardElem;
    scoreValueElem;
    nameTextElem;

    /** @type {number} */
    #score;

    /**
     * 
     * @param {string} name 
     * @param {string} color 
     */
    constructor(name, color) {
        /** @type {string} */
        this.name = name

        /** @type {string} */
        this.color = color;

        /** @type {boolean} */
        this.isTurn = false;

        /** @type {HTMLElement} */
        this.scoreBoardElem;

        /** @type {HTMLSpanElement} */
        this.scoreValueElem;

        this.#score = 0;

        /** @type {HTMLElement} */
        this.nameTextElem;

    }
    
    /** @returns {number} */
    getScore() { return this.#score; }
    
    incrementScore() { this.#setScore(this.getScore() + 1); }
    
    /** @type {number} */
    #setScore(score) {
        this.#score = score;
        this.#updateScore();
    }
    
    #updateScore() {
        this.scoreValueElem.innerText = this.#score.toString();
    }

    createPlayerElement() {
        /** @type {HTMLTemplateElement} */
        const playerTmplt = document.getElementById("player-template");
        /** @type {Node} */
        let clone = playerTmplt?.content?.cloneNode(true);
        
        this.nameTextElem = clone.querySelector(".player-name");
        this.nameTextElem.innerText = this.name;
        this.nameTextElem.style.setProperty("--arrow-color", this.color);
        
        this.scoreValueElem = clone.querySelector(".punkte-count");
        
        scoreBoardElem.appendChild(clone);
        
        players.push(this);
    }
    
    /** @param {boolean} myTurn  */
    toggleTurn(myTurn) {
        this.isTurn = myTurn;
        if (myTurn) {
            this.nameTextElem.classList.add("active");
        } else {
            this.nameTextElem.classList.remove("active");
        }
    }

}

function preloadImages() {
    for (let i = 0; i < images.length; i++) {
        let image = images[i];
        let img = new Image();
        img.src = image.url;
        img.onload = () => {
            return
        }
    }
}


function returnRandomImages(n) {
    let availableImages = images.copyWithin(0, 0);
    shuffleArray(availableImages);
    return availableImages.slice(0, n);
}


/**
 * 
* @param {number} numOfCards Positive Integer
*/
function loadMemoryCards(numOfCards) {
    if (numOfCards % 2 != 0) {
        throw new Error("Number of cards must be even!");
    };

    /** @type {string[]} */
    let availableImages = images.copyWithin(0, 0);

    let numOfPairs = numOfCards / 2;
    if (images.length < numOfPairs) {
        let neededImages = numOfPairs / availableImages.length;
        throw new Error(`There are not enough Images for this board size! Need ${neededImages} extra images`);
    }
    preloadImages();


    shuffleArray(availableImages);
    usedImages = returnRandomImages(numOfPairs);

    console.log(`Used ${usedImages.length}/${images.length} images`);


    for (let i = 0; i < numOfPairs; i++) {
        let img = usedImages[i];
        let card1 = new MemoryCardData(i, img["url"], false, null);
        let card2 = new MemoryCardData(i, img["url"], false, null);

        memoryCards.push(card1);
        memoryCards.push(card2);
    }
}

function buildField(cols, rows) {
    document.getElementById("memoryFeld")?.style.setProperty("--anz-rows", rows);
    document.getElementById("memoryFeld")?.style.setProperty("--anz-cols", cols);
    loadMemoryCards(rows * cols);
    shuffleArray(memoryCards);

    for (let i = 0; i < memoryCards.length; i++) {
        memoryCards[i].element = buildCard(memoryCards[i], memoryField);
    }
}

/**
* 
* @param {MemoryCardData} card 
* @param {HTMLElement} memoryField 
*/
function buildCard(card, memoryField) {
    const clone = (cardTemplate.content.cloneNode(true));

    /** @type {HTMLDivElement} */
    let mainDiv = clone.querySelector("div");
    mainDiv?.addEventListener("click", () => {
        gameState.flipCard(card);
    });
    if (!mainDiv) {
        return
    }
    mainDiv.dataset.cardId = card.id;


    memoryField.appendChild(clone);

    card.element = memoryField.lastElementChild;

    return card.element;
}

/**
 * 
 * @param {object[]} playerJSON 
 */
function buildPlayers(playerJSON) {
    for (let i = 0; i < playerJSON.length; i++) {
        const player = playerJSON[i];
        let playerObj = new Player(player["name"], player["color"]);
        playerObj.createPlayerElement();

        if (i == 0) {
            playerObj.toggleTurn(true);
        }
    }
}

/**
 * 
 * @param {URL} endpoint 
 */
async function getData(endpoint) {
    let res = await fetch(endpoint);
    let jsonRes = await res.json();
    console.log(jsonRes);
    images = jsonRes["images"];

    return jsonRes;
}


var images;
var usedImages;
var defaultImage;
var gameState;
var memoryField;
var cardTemplate;
var memoryCards;
var scoreBoardElem;
var players;
var isDevModeActive = false;



async function init() {
    defaultImage = new Image();
    defaultImage.src = "unknownCard.png";

    let data = await getData("/data.json");

    if (data["enableHelp"]) {
        (document.getElementById("dev-container")).hidden = false;
    }


    gameState = new GameState();

    memoryField = (document.getElementById("memoryFeld"));

    cardTemplate = (document.getElementById("card-template"));

    scoreBoardElem = (document.getElementById("scoreboard"));


    memoryCards = [];
    players = [];

    buildField(data["size"]["cols"], data["size"]["rows"]);

    buildPlayers(data["players"]);
}

init();
