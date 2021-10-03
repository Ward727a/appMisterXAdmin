function createAccount(){
    showLoadingScreen("Test loadingScreen");
    console.log();

    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/user",
        method: "POST",
        headers:{
            "content-type": 'application/json'
        }
    }

    let accountName = document.getElementById("newAccountName").value;

    let data = {
            "username": accountName,
            "adminKey": ""
        };

    window.api.sendAsync("buttonNewAccount", data, options);

    window.api.receiveOnce("createdAccount", function () {

        hideLoadingScreen();

        refreshUserList();

    })

}

const notification = document.getElementById('notification');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');
window.api.receiveOnce('update_available', () => {
    message.innerText = 'A new update is available. Downloading now...';
    notification.classList.remove('hidden');
});
window.api.receiveOnce('update_downloaded', () => {
    message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
    restartButton.classList.remove('hidden');
    notification.classList.remove('hidden');
});
function closeNotification() {
    notification.classList.add('hidden');
}
function restartApp() {
    window.api.send('restart_app');
}

function refreshUserList(){

    let userList = document.getElementById("userList");
    let template = document.getElementById("templateContainerUser");

    userList.innerHTML = window.api.getLoader();

    window.api.sendAsync("getAllUsers");

    window.api.receiveOnce("userListResponse", function (data){
        let dataJSON = JSON.parse(data);

        userList.innerHTML = "";

        dataJSON.users.forEach(elem=>{
            let clone = template.content.cloneNode(true);

            let pseudo = clone.querySelector("p.pseudo");
            let adminKey = clone.querySelector("p.adminKey");

            let shortcut = clone.querySelector("button.deleteShortcut");

            pseudo.innerText = elem.username;

            pseudo.addEventListener("click", function (event){

                openAccountDetails(elem);

            });

            shortcut.addEventListener("click", function (ev){

                deleteShortcut(elem.UID);

            })

            adminKey.innerText = elem.byKey;

            userList.appendChild(clone);

        })
    })
}

function openAccountDetails(elem){

    let pseudo = document.getElementById("accountDetailsPseudo");
    let uid = document.getElementById("accountDetailsUID");
    let password = document.getElementById("accountDetailsPassword");
    let valid = document.getElementById("accountDetailsValid");
    let input = document.getElementById("accountDetailsPseudoEdit");
    let accountDetails = document.getElementById("accountDetailsContainerBack");

    input.value = "";

    const killAllEvent = new AbortController();

    pseudo.addEventListener("click", ev=>{

        input.value = elem.username;
        editData(elem, pseudo, input);

     }, {signal: killAllEvent.signal});


    accountDetails.addEventListener("click", ev=>{
        if(ev.target.closest("#accountDetailsPseudo")) return;
        if (ev.target.closest("#accountDetailsPseudoEdit")) return;
        stopEdit(input, pseudo, elem);
     }, {signal: killAllEvent.signal});

    document.getElementById("accountDetailsContainerBack").addEventListener("click",ev=>{
       if(ev.target.closest("#accountDetailsContainer")) return;

        document.getElementById("accountDetailsContainerBack").style.display = "none";
        killAllEvent.abort();
    });

    accountDetails.style.display="flex";
    pseudo.innerText = elem.username;
    uid.innerText = elem.UID;
    password.innerHTML = elem.password? "<span class='valid'>Défini</span>":"<span class='warning'>Non défini</span>";
    valid.innerHTML = elem.valid? "<span class='valid'>Oui</span>":"<span class='warning'>Non</span>";


    if(elem.valid){

        document.getElementById("stopAccount").style.display = "block";
        document.getElementById("activateAccount").style.display = "none";

    } else {

        document.getElementById("activateAccount").style.display = "block";
        document.getElementById("stopAccount").style.display = "none";
    }

    {
        let acceptParamBtn = document.getElementById("acceptParam");
        acceptParamBtn.addEventListener("click", ev=>{

            console.log("AcceptParam");

            if (acceptParamBtn.className === "valid") {

                showLoadingScreen("Modification de l'utilisateur...")

                window.api.sendAsync("editUser", elem.UID, pseudo.innerText);

                window.api.receiveOnce("editUserResponse", function () {

                    hideLoadingScreen();

                    acceptParamBtn.className = "unactive";

                    refreshUserList();

                })

            }}, {signal: killAllEvent.signal});

        let resetPasswordBTN = document.getElementById("resetPassword");
        resetPasswordBTN.addEventListener("click", ev => {

            openModal(
                "Réinitialiser le mot de passe de \"" + elem.username + "\" ?",
                "Voulez vous réellement réinitialiser le mot de passe du compte de " + elem.username + " ?" +
                "<br/>" +
                "<br/>" +
                "<span class='warning'>Vous ne pourrez pas retournez en arrière !</span>",
                {
                    warning: {
                        text: "Oui, je veux  réinitialiser le mot de passe",
                        callback: function (modal, signal) {

                            window.api.sendAsync("resetPassword", elem.UID);
                            showLoadingScreen("Réinitialisation du mot de passe, veuillez patientez...")

                            window.api.receiveOnce("resetPasswordResponse", function (success, retry) {

                                if (success) {


                                    document.getElementById("accountDetailsContainerBack").style.display = "none";
                                    modal.style.display = "none";
                                    hideLoadingScreen();
                                    ev.stopPropagation();
                                    signal.abort();
                                    killAllEvent.abort();
                                } else if (!retry) {

                                    showLoadingScreen("Erreur ! Nouvel essai en cours...");
                                    window.api.sendAsync("resetPassword", elem.UID, true);

                                }

                            });
                        }
                    },
                    valid: {
                        text: "Non, retourner en arrière",
                        callback: function (modal, signal) {
                            modal.style.display = "none";
                            document.getElementById("accountDetailsContainerBack").style.display = "none";
                            signal.abort();
                            killAllEvent.abort();
                        }
                    }
                });

         }, {signal: killAllEvent.signal});

        let deleteAccountBTN = document.getElementById("deleteAccount");
        deleteAccountBTN.addEventListener("click", ev => {

            openModal(
                "Supprimer le compte \"" + elem.username + "\" ?",
                "Êtes vous sûr de vouloir supprimez le compte s'appelant \"" + elem.username + "\" ?" +
                "<br/>" +
                "<br/>" +
                "<span class='warning'>Vous ne pourrez pas retournez en arrière !</span>",
                {
                    warning: {
                        text: "Oui, je veux supprimer ce compte",
                        callback: function (modal, signal) {

                            window.api.sendAsync("deleteAccount", elem.UID);
                            showLoadingScreen("Suppression du compte en cours, veuillez patienter...");

                            window.api.receiveOnce("removeAccountResponse", function () {
                                hideLoadingScreen();
                                modal.style.display = "none";
                                document.getElementById("accountDetailsContainerBack").style.display = "none";
                                refreshUserList();
                                ev.stopPropagation();
                                console.log("refresh delete");
                                signal.abort();
                                killAllEvent.abort();
                            })

                        }
                    },
                    valid: {
                        text: "Non, retourner en arrière",
                        callback: function (modal, signal) {


                            document.getElementById("accountDetailsContainerBack").style.display = "none";
                            modal.style.display = "none";
                            console.log("refresh delete no");
                            signal.abort();
                            killAllEvent.abort();

                        }
                    }
                }
            )

         }, {signal: killAllEvent.signal});

        let stopAccountBTN = document.getElementById("stopAccount");
        stopAccountBTN.addEventListener("click", ev=>{

            showLoadingScreen("Désactivation du compte en cours...");
            window.api.sendAsync("stateAccount", elem.UID, false);

            window.api.receiveOnce("stateAccountResponse", function () {

                hideLoadingScreen();
                document.getElementById("activateAccount").style.display = "block";
                document.getElementById("stopAccount").style.display = "none";
                valid.innerHTML = "<span class='warning'>Non</span>";
                ev.stopPropagation();
                refreshUserList();

            })

         }, {signal: killAllEvent.signal});
        let activateAccountBTN = document.getElementById("activateAccount");
        activateAccountBTN.addEventListener("click", ev=>{

            showLoadingScreen("Activation du compte en cours...");
            window.api.sendAsync("stateAccount", elem.UID, true);

            window.api.receiveOnce("stateAccountResponse", function () {

                hideLoadingScreen();
                document.getElementById("activateAccount").style.display = "none";
                document.getElementById("stopAccount").style.display = "block";
                valid.innerHTML = "<span class='valid'>Oui</span>";
                ev.stopPropagation();
                refreshUserList();

            })

        }, {signal: killAllEvent.signal});
    } // EVENT FOR BUTTON

}

function editData(user, elem, input){
    elem.style.display="none";
    input.value = elem.innerText;
    input.style.display="inline";
    input.focus();
}
function stopEdit(input, elem, user){
    if(input.value !=="" && input.value.length < 30)elem.innerText = input.value;
    input.style.display="none";
    elem.style.display="inline";

    checkEdit(input.value, user);
}
function checkEdit(pseudo, user){
    let acceptParamBtn = document.getElementById("acceptParam");

    if(pseudo !== "" && pseudo !== user.username){
        acceptParamBtn.className = "valid";
    } else {
        acceptParamBtn.className = "unactive";
    }

}

function setupDelete() {
    window.addEventListener("keydown", ev => {

        if (ev.key === "Shift" && !ev.repeat) {

            let trash = document.getElementsByClassName("deleteButtonContainer");

            for (let i = 0; i < trash.length; i++) {

                trash.item(i).style.visibility = "inherit";
                trash.item(i).style.opacity = "100%";

            }


        }

    });
    window.addEventListener("keyup", ev => {

        if (ev.key === "Shift" && !ev.repeat) {

            let trash = document.getElementsByClassName("deleteButtonContainer");

            for (let i = 0; i < trash.length; i++) {

                trash.item(i).style.opacity = "0";
                trash.item(i).style.visibility = "hidden";

            }


        }

    });
}
function deleteShortcut(uid){

    showLoadingScreen("Suppression du compte en cours, veuillez patienter...");

    window.api.sendAsync("deleteAccount", uid);

    window.api.receiveOnce("removeAccountResponse", function () {
        refreshUserList();
        hideLoadingScreen();
    })

}

refreshUserList();
