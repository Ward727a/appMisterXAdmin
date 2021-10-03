let menuOpen;

function showMenu() {

    if(!menuOpen) {
        let menuTop = document.getElementById("containerMenu");
        let menuBTN = document.getElementById("menuBtnContainer");

        menuTop.style.left = "0";

        menuOpen = true;
    } else {
        let menuTop = document.getElementById("containerMenu");
        let menuBTN = document.getElementById("menuBtnContainer");

        menuTop.style.left = "-100vw";

        menuOpen = false;
    }

}

function changePage(page) {
    window.api.sendAsync("changePage", page);
}
