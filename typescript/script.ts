

class DevTools {
    static flipAll() {
        memoryCards.forEach((card: MemoryCardData) => {
            card.flipped = !card.flipped;
        });
        GameState.performFlips();
    }

    static toggleDevMode() {
        isDevModeActive = !isDevModeActive;

        if (!isDevModeActive) {
            GameState.setShadowHint(null, null);
        }

        let turnBtn: HTMLButtonElement;
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

abstract class GameState {
    static flippedCards: Array<MemoryCardData> = [];
    static matchedPairs: Array<number> = [];
    static gameLocked: boolean = false;
    static roundsCounter: HTMLSpanElement;
    static currentRound: number = 1

    static nextRound() {
        if (!(this.roundsCounter instanceof HTMLSpanElement)) {
            this.roundsCounter = document.getElementById("runden-counter") as HTMLSpanElement;
        };
        this.currentRound++;
        this.roundsCounter.innerText = this.currentRound.toString();
    }

    static flipCard(card: MemoryCardData) {
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


    static setShadowHint(card1: MemoryCardData, card2: MemoryCardData) {
        let shadowValue = "black 0 0 5px";
        try {
            if (card1 === null || card2 === null) {
                for (const card of memoryCards) {
                    if (card.element === null) {
                        continue
                    }
                    card.element.style.boxShadow = "none";
                }
                return;
            }
            if (card1.element === null || card2.element === null) {
                throw Error("Element is null!")
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

    static revealCard(card: MemoryCardData) {
        if (!card.flipped && !card.guessed) {
            console.error("Card is not flipped!");
            return;
        }
        if (card.element === null) {
            throw Error("Card element is null")
        }
        card.element.querySelector("img").src = String(card.image.url);
    }

    static checkForMatch() {
        const card1: MemoryCardData = this.flippedCards[0];
        const card2: MemoryCardData = this.flippedCards[1];

        if (card1.pairId === card2.pairId) {
            this.onMatchFound(card1, card2);
        } else {
            this.gameLocked = true;
            this.setCursorStyle("not-allowed");
            setTimeout(() => {
                this.resetFlippedCards();
                this.markNextTurnPlayer();
                this.gameLocked = false;
                this.setCursorStyle("pointer");
            }, 1000);
        };
        this.nextRound();
    }

    static setCursorStyle(style: string) {
        for (const card of memoryCards) {
            if (card.element === null) {
                throw Error("Card element is null")
            }
            card.element.style.cursor = style;
        }
    }

    static onMatchFound(card1: MemoryCardData, card2: MemoryCardData) {
        this.matchedPairs.push(card1.pairId);
        card1.guessed = true;
        card2.guessed = true;
        this.flippedCards = [];
        this.setCardsStyle(card1, card2, "background-color", this.getCurrentPlayer().color);
        this.setCardsStyle(card1, card2, "filter", "opacity(0.5)");
        this.getCurrentPlayer().incrementScore();
        this.checkGameOver();
    }

    static setCardsStyle(card1: MemoryCardData, card2: MemoryCardData, property: string, value: string) {
        card1.element.style.setProperty(property, value);
        card2.element.style.setProperty(property, value);
    }

    static resetFlippedCards() {
        this.flippedCards.forEach(card => { card.flipped = false });
        this.performFlips();
        this.flippedCards = [];
        this.gameLocked = false;
    }


    static performFlips() {
        memoryCards.forEach(card => {
            if (card.element === null) {
                throw Error("Card element is null")
            }
            if (card.flipped) {
                // card.element.classList.add("flipped");
                (card.element.querySelector("img")).src = card.image.url;
            } else {
                // card.element.classList.remove("flipped");
                (card.element.querySelector("img")).src = defaultImage.src;
            }
        })
    }


    static getUnflippedCards() {
        return memoryCards.filter(card => !card.flipped);
    }

    static markNextTurnPlayer() {
        console.debug("next Turn!");
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (player.isTurn) {
                player.toggleTurn(false);
                this.getNextPlayer(player).toggleTurn(true);
                return
            }
        }
    }

    static getNextPlayer(player: Player) {
        if (players.length === 1) {
            return players[0]
        }
        for (let i = 0; i < players.length; i++) {
            if (players[i] === player) {
                if (i + 1 == players.length) {
                    return players[0];
                } else {
                    return players[i + 1];
                }
            }
        }
        throw Error();
    }

    static getCurrentPlayer() {
        for (const player of players) {
            if (player.isTurn) {
                return player;
            }
        }
        throw Error();
    }

    static checkGameOver() {
        if (this.getUnflippedCards().length <= 0) {
            console.log("Game over!");
            let winner = this.#getWinner();
            setTimeout(() => {
                GameState.showWinner(winner);
            }, 1500);
        }
    }

    static showWinner(winner: Player) {
        let headingElement = document.getElementsByTagName("h1")[0];
        if (players.length === 1) {
            headingElement.textContent = `Glückwunsch! Du hast gegen dich selbst gewonnen!`;
        } else {
            headingElement.textContent = `Herzlichen Glückwunsch ${winner.displayName}, du hast gewonnen!`;
        }
    }

    /**
     * 
     * @returns {string} The players name
     */
    static #getWinner(): Player {
        let maxGuesses = 0;
        let winner = undefined;
        for (const player of players) {
            if (player.score > maxGuesses) {
                maxGuesses = player.score;
                winner = player;
            }
        }
        if (winner === undefined) {
            throw Error("Irgendwas ist doof");
        }
        return winner;
    }

    static restartGame() {
        window.location.reload();
    }
}


class MemoryCardData {

    pairId: number;
    image: Image_;
    flipped: boolean;
    element: HTMLElement;
    guessed: boolean;

    constructor(pairId: number, image: Image_, flipped: boolean) {
        this.pairId = pairId;
        this.image = image;
        this.flipped = flipped;
        this.element = null;
        this.guessed = false;
    }

    /**
     * Gibt die Partnerkarte aus
     * @returns Der Kartenpartner
     */
    getPair(): MemoryCardData {
        for (const card of memoryCards) {
            if (card.pairId === this.pairId) {
                return card;
            }
        };
    };

    buildCard(memoryField: HTMLElement) {
        const clone = cardTemplate.content.cloneNode(true) as HTMLElement;
    
        /** @type {HTMLDivElement} */
        let mainDiv: HTMLDivElement = clone.querySelector("div");
        mainDiv?.addEventListener("click", () => {
            GameState.flipCard(this);
        });
        if (!mainDiv) {
            return
        }
        mainDiv.dataset.cardId = this.pairId.toString();
        mainDiv.setAttribute("tabindex", "0");
    
        memoryField.appendChild(clone);
    
        this.element = memoryField.lastElementChild as HTMLElement;
    
        return this.element;
    }
}

class Player {
    displayName: string;
    color: string;
    isTurn: boolean;
    scoreBoardElem: HTMLElement;
    scoreValueElem: HTMLSpanElement;
    nameTextElem: HTMLElement;
    private _score: number;
    private _isOnlyChild: boolean;

    constructor(name: string, color: string) {
        this.displayName = name
        this.color = color;
        this.isTurn = false;
        this.scoreBoardElem;
        this.scoreValueElem;

        this._score = 0;
        this.nameTextElem;

        console.info(this);
    }
    public get score(): number { return this._score; }
    
    
    incrementScore() { this.setScore(this._score + 1); }
    
    private setScore(score: number) { this._score = score; this.updateScore(); }
    
    private updateScore() { this.scoreValueElem.innerText = this.score.toString(); }

    static createPlayerElement(player: Player, singlePlayer?: boolean) {
        const playerTmplt: HTMLTemplateElement = document.getElementById("player-template") as HTMLTemplateElement;
        let clone: HTMLUnknownElement = playerTmplt?.content?.cloneNode(true) as HTMLUnknownElement;
        
        player.nameTextElem = clone.querySelector(".player-name");
        player.nameTextElem.innerText = player.displayName;
        player.nameTextElem.style.setProperty("--arrow-color", player.color);

        if (singlePlayer !== undefined && singlePlayer) {
            player.nameTextElem.classList.add("only-player");
        }
        
        player.scoreValueElem = clone.querySelector(".punkte-count");
        
        scoreBoardElem.appendChild(clone);
    }
    
    toggleTurn(myTurn: boolean) {
        this.isTurn = myTurn;
        if (myTurn) {
            this.nameTextElem.classList.add("active");
        } else {
            this.nameTextElem.classList.remove("active");
        }
    }

}

function preloadImages(images: Array<Image_>) {
    for (let i = 0; i < images.length; i++) {
        let image = images[i];
        console.debug("Preloading: " + image.url);
        let img = new Image();
        img.src = image.url;
        img.onload = () => {
            if (!img.complete) {
                console.error("Image not completed!");
                console.error(img);
                console.error(image);
            } else {
                console.log("Image loaded");
            }
            if (img.naturalWidth === 0) {
                console.error("Image width is 0 (something went wrong!)");
                console.error(image);
                console.error(img);
            }
            return
        }
    }
}

/**
 * 
 * @param n The amount of Images to be returned
 * @returns Random images
 */
function returnRandomImages(n: number): Array<Image_> {
    let availableImages = images.copyWithin(0, 0);
    shuffleArray(availableImages);
    return availableImages.slice(0, n);
}


function loadMemoryCards(numOfCards: number): void {
    if (numOfCards % 2 != 0) {
        throw new Error("Number of cards must be even!");
    };

    let availableImages: Array<Image_> = images.copyWithin(0, 0);

    let numOfPairs: number = numOfCards / 2;
    if (images.length < numOfPairs) {
        let neededImages = numOfPairs / availableImages.length;
        throw new Error(`There are not enough Images for this board size! Need ${neededImages} extra images`);
    }
    preloadImages(images);


    shuffleArray(availableImages);
    usedImages = returnRandomImages(numOfPairs);

    console.log(`Used ${usedImages.length}/${images.length} images`);


    for (let i = 0; i < numOfPairs; i++) {
        let img = usedImages[i];
        let card1 = new MemoryCardData(i, img, false);
        let card2 = new MemoryCardData(i, img, false);

        memoryCards.push(card1);
        memoryCards.push(card2);
    }
}

function buildField(cols: number, rows: number) {
    const memoryFeld = document.getElementById("memoryFeld");

    memoryFeld.style.setProperty("--anz-rows", rows.toString());
    memoryFeld.style.setProperty("--anz-cols", cols.toString());

    loadMemoryCards(rows * cols);
    shuffleArray(memoryCards);

    for (const card of memoryCards) {
        card.buildCard(memoryField);
    }
}

function buildPlayers(playerJSON: {name: string, color: string}[]) {
    if (playerJSON.length === 1) {
        let playerObj = new Player(playerJSON[0].name, playerJSON[0].color);
        Player.createPlayerElement(playerObj)
        return
    }
    for (let i = 0; i < playerJSON.length; i++) {
        const player: {name: string, color: string} = playerJSON[i];
        let playerObj = new Player(player.name, player.color);
        players.push(playerObj);

        Player.createPlayerElement(playerObj);

        if (i == 0) { playerObj.toggleTurn(true) };
    }
}


async function getData(endpoint: string) {
    console.debug("Data endpoint: " + endpoint);
    let res = await fetch(endpoint);
    let jsonRes = await res.json();
    console.log(jsonRes);
    images = jsonRes["images"];
    return jsonRes;
}


var images: Array<Image_> = [];
var usedImages: Array<Image_> = [];
var defaultImage: HTMLImageElement = new Image();
var memoryField: HTMLElement = document.getElementById("memoryFeld");
var cardTemplate: HTMLTemplateElement = document.getElementById("card-template") as HTMLTemplateElement;
var memoryCards: Array<MemoryCardData> = [];
var scoreBoardElem: HTMLDivElement = document.getElementById("scoreboard") as HTMLDivElement;
var players: Array<Player> = [];
var isDevModeActive = false;



async function init() {
    defaultImage.src = "unknownCard.png";

    let data = await getData("data.json");

    if (data["enableHelp"]) {
        (document.getElementById("dev-container")).hidden = false;
    }

    buildField(data["size"]["cols"], data["size"]["rows"]);

    buildPlayers(data["players"]);
}

init();
