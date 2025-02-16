
class GameAI extends Player {

    constructor(playerToUse: Player) {
        super("AI", "black");
    }

    toggleTurn(myTurn: boolean): void {
        this.isTurn = myTurn
        if (this.isTurn) {
            this.nameTextElem.classList.add("active");
        } else {
            this.nameTextElem.classList.remove("active");
        }
    }
}