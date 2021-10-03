function includeHTML() {
    var z, i, element, file, xhttp;
    /* Loop through a collection of all HTML elements: */
    z = document.getElementsByTagName("*");
    for (i = 0; i < z.length; i++) {
        element = z[i];
        /*search for elements with a certain atrribute:*/
        file = element.getAttribute("include-html");
        if (file) {
            /* Make an HTTP request using the attribute value as the file name: */
            xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status === 200) {element.innerHTML = this.responseText;}
                    if (this.status === 404) {element.innerHTML = "Page not found.";}
                    /* Remove the attribute, and call this function once more: */
                    element.removeAttribute("include-html");
                    includeHTML();
                }
            }
            xhttp.open("GET", file, true);
            xhttp.send();
            /* Exit the function: */
            return;
        }
    }
}

function showLoadingScreen(message){

    if(document.getElementById("containerLoadingScreen") != null){
        let loadingScreen = document.getElementById("containerLoadingScreen");
        let loadingMessage = document.getElementById("messageLoadingScreen");

        loadingScreen.style.display = "block";
        loadingMessage.innerText = message;

        console.log("loading...");
    }

}
function hideLoadingScreen(){

    if(document.getElementById("containerLoadingScreen") != null){
        let loadingScreen = document.getElementById("containerLoadingScreen");

        loadingScreen.style.display = "none";
    }
}

function openModal(title = "", description = "", button){

    let modalKiller = new AbortController();

    let modalContainer = document.getElementById("modalContainerBack");
    let modalTitle = document.getElementById("modalTitle");
    let modalText = document.getElementById("modalDescription");

    let modalValid = document.getElementById("modalConfirmBTN");
    let modalWarning = document.getElementById("modalErrorBTN");
    let modalInfo = document.getElementById("modalInfoBTN");
    let modalBasic = document.getElementById("modalBasicBTN");

    if(title !== ""){

        modalTitle.style.display = "block";
        modalTitle.innerText = title;

    } else {
        modalTitle.style.display = "none";
    }

    if(description !== ""){

        modalText.style.display = "block"
        modalText.innerHTML = description;

    } else {
        modalText.style.display = "none";
    }

    if(button !== undefined){

        if(button.valid !== undefined){

            let btnValid = button.valid;

            if(btnValid.text !== "" && btnValid.callback !== undefined){
                modalValid.style.display = "block";
                modalValid.innerText = btnValid.text;

                modalValid.addEventListener("click", ev=>{
                    btnValid.callback(modalContainer, modalKiller);
                }, {signal: modalKiller.signal})
            }

        } else {
            modalValid.style.display = "none";
        }

        if(button.warning !== undefined){

            let btnWarning = button.warning;

            if(btnWarning.text !== "" && btnWarning.callback !== undefined){
                modalWarning.style.display = "block";
                modalWarning.innerText = btnWarning.text;

                modalWarning.addEventListener("click", ev=>{
                    btnWarning.callback(modalContainer, modalKiller);
                }, {signal: modalKiller.signal})
            }

        } else {
            modalWarning.style.display = "none";
        }

        if(button.info !== undefined){

            let btnInfo = button.info;

            if(btnInfo.text !== "" && btnInfo.callback !== undefined){
                modalInfo.style.display = "block";
                modalInfo.innerText = btnInfo.text;

                modalInfo.addEventListener("click", ev=>{
                    btnInfo.callback(modalContainer, modalKiller);
                }, {signal: modalKiller.signal})
            }

        } else {
            modalInfo.style.display = "none";
        }

        if(button.basic !== undefined){

            let btnBasic = button.basic;

            if(btnBasic.text !== "" && btnBasic.callback !== undefined){
                modalBasic.style.display = "block";
                modalBasic.innerText = btnBasic.text;

                modalBasic.addEventListener("click", ev=>{
                    btnBasic.callback(modalContainer, modalKiller);
                }, {signal: modalKiller.signal})
            }

        } else {
            modalBasic.style.display = "none";
        }

    }

    modalContainer.style.display = "flex";

}
