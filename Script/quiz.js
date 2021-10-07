

function refreshQuiz(){

    let quizList = document.getElementById("quizList");
    let quizTemplate = document.getElementById("templateContainerQuiz");

    quizList.innerHTML = window.api.getLoader();

    window.api.sendAsync("getAllQuiz");

    window.api.receiveOnce("getAllQuizResponse", function (data){

        quizList.innerHTML = "";

        let dataJSON = JSON.parse(data);

        dataJSON.data.forEach(elem=>{

            let clone = quizTemplate.content.cloneNode(true);

            let title = clone.querySelector("p.title");
            let author = clone.querySelector("p.author");


            let uploadButton = clone.querySelector("button.setupButton");
            let shortcut = clone.querySelector("button.deleteShortcut");

            title.innerText = elem.title;
            author.innerText = elem.author;

            title.addEventListener("click", ev=>{

                openQuizDetails(elem);

            });

            shortcut.addEventListener("click", function (ev){

                deleteShortcut(elem.uid);

            })

            uploadButton.addEventListener("click", function (ev){

                if(uploadButton.className === "valid setupButton") {
                    upload(uploadButton, elem.uid);
                } else {
                    remove(uploadButton, elem.uid);
                }

            })

            quizList.appendChild(clone);

            if(elem.started){

                uploadButton.childNodes.item(0).style.display = "none";
                uploadButton.className = "warning setupButton";
                uploadButton.childNodes.item(2).style.display = "inherit";
            }

        })

    })

}
refreshQuiz()

function createQuiz(){

    let title = document.getElementById("newQuizName");

    window.api.sendAsync("createQuiz", title.value);

    showLoadingScreen("Création du quiz en cours...");

    window.api.receiveOnce("createQuizResponse", function (success) {

        if(success){

            refreshQuiz()
            hideLoadingScreen();

        }

    })

}

function openQuizDetails(elem){

    let title = document.getElementById("quizDetailsTitle");
    let uid = document.getElementById("quizDetailsUID");
    let valid = document.getElementById("quizDetailsValid");
    let numbers = document.getElementById("quizDetailsNumber");
    let author = document.getElementById("quizDetailsAuthor");
    let input = document.getElementById("quizDetailsTitleEdit");
    let quizDetails = document.getElementById("quizDetailsContainerBack");

    input.value = "";

    const killAllEvent = new AbortController();

    title.addEventListener("click", ev=>{

        input.value = elem.title;
        editData(input, title, elem);

    }, {signal: killAllEvent.signal});


    quizDetails.addEventListener("click", ev=>{
        if(ev.target.closest("#quizDetailsTitle")) return;
        if (ev.target.closest("#quizDetailsTitleEdit")) return;
        stopEdit(input, title, elem);
    }, {signal: killAllEvent.signal});


    quizDetails.addEventListener("click",ev=>{
        if(ev.target.closest("#quizDetailsContainer")) return;

        quizDetails.style.display = "none";
        killAllEvent.abort();
    }, {signal: killAllEvent.signal});

    quizDetails.style.display = "flex";
    title.innerText = elem.title;
    author.innerText = elem.author;
    uid.innerText = elem.uid;
    valid.innerHTML = elem.valid? "<span class='valid'>Oui</span>":"<span class='warning'>Non</span>";
    numbers.innerText = elem.number;

    if(elem.valid){

        document.getElementById("stopQuiz").style.display = "block";
        document.getElementById("activateQuiz").style.display = "none";

    } else {

        document.getElementById("activateQuiz").style.display = "block";
        document.getElementById("stopQuiz").style.display = "none";
    }


    {
        let acceptParamBtn = document.getElementById("acceptParam");
        acceptParamBtn.addEventListener("click", ev=>{

            console.log("AcceptParam");

            if (acceptParamBtn.className === "valid") {

                showLoadingScreen("Modification du quiz...")

                window.api.sendAsync("editQuiz", elem.uid, title.innerText);

                window.api.receiveOnce("editQuizResponse", function () {

                    hideLoadingScreen();

                    acceptParamBtn.className = "unactive";

                    refreshQuiz();

                })

            }}, {signal: killAllEvent.signal});

        let deleteQuizBTN = document.getElementById("deleteQuiz");
        deleteQuizBTN.addEventListener("click", ev => {

            openModal(
                "Supprimer le quiz \"" + elem.title + "\" ?",
                "Êtes vous sûr de vouloir supprimez le quiz s'appelant \"" + elem.username + "\" ?" +
                "<br/>" +
                "<br/>" +
                "<span class='warning'>Vous ne pourrez pas retournez en arrière !</span>",
                {
                    warning: {
                        text: "Oui, je veux supprimer ce quiz",
                        callback: function (modal, signal) {

                            window.api.sendAsync("removeQuiz", elem.uid);
                            showLoadingScreen("Suppression du quiz en cours, veuillez patienter...");

                            window.api.receiveOnce("removeQuizResponse", function () {
                                hideLoadingScreen();
                                modal.style.display = "none";
                                document.getElementById("quizDetailsContainerBack").style.display = "none";
                                refreshQuiz();
                                ev.stopPropagation();
                                console.log("refresh delete");
                                signal.abort();
                                killAllEvent.abort();
                            })

                        }
                    },
                    valid: {
                        text: "Non, retourner en arrière",
                        callback: function (modal) {


                            modal.style.display = "none";
                            console.log("refresh delete no");

                        }
                    }
                }
            )

        }, {signal: killAllEvent.signal});

        let stopAccountBTN = document.getElementById("stopQuiz");
        stopAccountBTN.addEventListener("click", ev=>{

            showLoadingScreen("Désactivation du quiz en cours...");
            window.api.sendAsync("stateQuiz", elem.uid, false);

            window.api.receiveOnce("stateQuizResponse", function () {

                hideLoadingScreen();
                document.getElementById("activateQuiz").style.display = "block";
                document.getElementById("stopQuiz").style.display = "none";
                valid.innerHTML = "<span class='warning'>Non</span>";
                ev.stopPropagation();
                refreshQuiz();

            })

        }, {signal: killAllEvent.signal});
        let activateAccountBTN = document.getElementById("activateQuiz");
        activateAccountBTN.addEventListener("click", ev=>{

            showLoadingScreen("Activation du quiz en cours...");
            window.api.sendAsync("stateQuiz", elem.uid, true);

            window.api.receiveOnce("stateQuizResponse", function () {

                hideLoadingScreen();
                document.getElementById("activateQuiz").style.display = "none";
                document.getElementById("stopQuiz").style.display = "block";
                valid.innerHTML = "<span class='valid'>Oui</span>";
                ev.stopPropagation();
                refreshQuiz();

            })

        }, {signal: killAllEvent.signal});
    } // EVENT FOR BUTTON

}

function editData(input, title){
    title.style.display="none";
    input.value = title.innerText;
    input.style.display="inline";
    input.focus();
}
function stopEdit(input, title, elem){
    if(input.value !=="" && input.value.length < 30) title.innerText = input.value;
    input.style.display="none";
    title.style.display="inline";

    checkEdit(input.value, elem);
}
function checkEdit(title, elem){
    let acceptParamBtn = document.getElementById("acceptParam");

    if(title !== "" && title !== elem.title){
        acceptParamBtn.className = "valid";
    } else {
        acceptParamBtn.className = "unactive";
    }

}

function setupDelete(){
    window.addEventListener("keydown", ev => {

        if (ev.key === "Shift" && !ev.repeat) {

            let trash = document.getElementsByClassName("deleteButtonContainer");

            for (let i = 0; i< trash.length; i++){

                trash.item(i).style.visibility = "inherit";
                trash.item(i).style.opacity = "100%";

            }


        }

    });
    window.addEventListener("keyup", ev => {

        if (ev.key === "Shift" && !ev.repeat) {

            let trash = document.getElementsByClassName("deleteButtonContainer");

            for (let i = 0; i< trash.length; i++){

                trash.item(i).style.opacity = "0";
                trash.item(i).style.visibility = "hidden";

            }


        }

    });
}

setupDelete();

function deleteShortcut(uid){

    showLoadingScreen("Suppression du compte en cours, veuillez patienter...");

    window.api.sendAsync("removeQuiz", uid);

    window.api.receiveOnce("removeQuizResponse", function () {
        refreshQuiz();
        hideLoadingScreen();
    })

}

function upload(button, uid){

    let uploadIcon = button.childNodes.item(0);
    let loadIcon = button.childNodes.item(2);
    let stopIcon = button.childNodes.item(4);

    console.log(loadIcon)
    button.className = "info setupButton"
    uploadIcon.style.display = "none";
    loadIcon.style.display = "inherit";

    window.api.sendAsync("setupQuiz", uid);

    window.api.receive("quizSetup", (returnUID)=>{

        if(uid === returnUID){

            button.className = "warning setupButton"
            loadIcon.style.display = "none";
            stopIcon.style.display = "inherit";

        }

    })

}

function remove(button, uid){

    let uploadIcon = button.childNodes.item(0);
    let loadIcon = button.childNodes.item(2);
    let stopIcon = button.childNodes.item(4);

    console.log(loadIcon)
    button.className = "info setupButton"
    stopIcon.style.display = "none";
    loadIcon.style.display = "inherit";

    window.api.sendAsync("stopQuiz", uid);

    window.api.receive("quizStop", (returnUID)=>{

        if(uid === returnUID){

            button.className = "valid setupButton"
            loadIcon.style.display = "none";
            uploadIcon.style.display = "inherit";

        }

    })

}
