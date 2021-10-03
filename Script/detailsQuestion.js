
async function openQuestionDetails(elem){

    let questionDetails = document.getElementById("questionDetailsContainerBack");

    let title = document.getElementById("questionDetailsTitle");
    let titleInput = document.getElementById("questionDetailsTitleEdit");

    let question = document.getElementById("questionDetailsInput");
    let uid = document.getElementById("questionDetailsUID");

    let response = document.getElementById("questionDetailsResponse");
    let responseInput = document.getElementById("questionDetailsResponseEdit");

    let counter = document.getElementById("questionDetailsCounter");
    let counterInput = document.getElementById("questionDetailsCounterEdit");

    let quiz = document.getElementById("questionDetailsQuiz");
    let order = document.getElementById("questionDetailsOrder");

    let deleteQuestionBTN = document.getElementById("deleteQuestion");

    const killAllEvent = new AbortController();

    let questionDetailsEdit = await ClassicEditor.create(document.querySelector("#questionDetailsInput"), {
        toolbar: [ 'bold', 'italic'],
        data: elem.question
    })
        .then(editor=>{
            return editor;
        }).catch(err=>{console.error(err)});

    questionDetailsEdit.setData(elem.question);

    let questionContent = elem.question;

    questionDetailsEdit.model.document.on("change:data", ()=>{
        let inputValue = [titleInput.value, responseInput.value, counterInput.value, parseInt(order.value), quiz.value, questionContent];
        let defaultValue = [elem.title, elem.response, elem.falseResponse, elem.order, elem.quiz, elem.question];

        checkEdit(inputValue,  defaultValue);
        questionContent = questionDetailsEdit.getData();
    })

    title.addEventListener("click", ev=>{

        titleInput.value = elem.title;
        editData(title, titleInput);

    }, {signal: killAllEvent.signal});
    response.addEventListener("click", ev=>{

        response.value = elem.response;
        editData(response, responseInput);

    }, {signal: killAllEvent.signal});
    counter.addEventListener("click", ev=>{

        counter.value = elem.falseResponse;
        editData(counter, counterInput);

    }, {signal: killAllEvent.signal});

    questionDetails.addEventListener("click", ev=>{
        if(ev.target.closest("#questionDetailsTitle") || ev.target.closest("#questionDetailsResponse") || ev.target.closest("#questionDetailsCounter")) return;
        if (ev.target.closest("#questionDetailsTitleEdit") || ev.target.closest("#questionDetailsResponseEdit") || ev.target.closest("#questionDetailsCounterEdit")) return;
        stopEdit(titleInput, title, elem.title);
        stopEdit(responseInput, response, elem.response);
        stopEdit(counterInput, counter, elem.falseResponse);

        let inputValue = [titleInput.value, responseInput.value, counterInput.value, parseInt(order.value), quiz.value, questionContent];
        let defaultValue = [elem.title, elem.response, elem.falseResponse, elem.order, elem.quiz, elem.question];

        checkEdit(inputValue,  defaultValue);
    }, {signal: killAllEvent.signal});

    document.getElementById("questionDetailsContainerBack").addEventListener("click",async ev=>{
        if(ev.target.closest("#questionDetailsContainer")) return;

        if(questionDetailsEdit.state === 'ready') await questionDetailsEdit.destroy();
        document.getElementById("questionDetailsContainerBack").style.display = "none";
        killAllEvent.abort();
    });

    questionDetails.style.display="flex";

    title.innerText = elem.title;
    uid.innerText = elem.uid;
    response.innerText = elem.response;
    counter.innerText = elem.falseResponse;
    order.value = elem.order;

    titleInput.value = elem.title;

    responseInput.value = elem.response;
    counterInput.value = elem.falseResponse;
    quiz.innerHTML = ""


    let inputValue = [titleInput.value, responseInput.value, counterInput.value, parseInt(order.value), quiz.value];
    let defaultValue = [elem.title, elem.response, elem.falseResponse, elem.order, elem.quiz];

    checkEdit(inputValue,  defaultValue);

    quizArray.forEach(value => {

        let option = document.createElement("option");

        option.innerText = value.title;
        option.value = value.uid;

        option.selected = value.uid === elem.quiz;

        quiz.appendChild(option);

    })

    {
        let acceptParamBtn = document.getElementById("acceptParam");
        acceptParamBtn.addEventListener("click", ev=>{

            console.log("AcceptParam");

            if (acceptParamBtn.className === "valid") {

                showLoadingScreen("Modification de la question...")

                let data = {
                    uid : elem.uid,
                    title : title.innerText,
                    response : response.innerText,
                    falseResponse: counter.innerText,
                    order: parseInt(order.value),
                    question: questionDetailsEdit.getData(),
                    forQuiz: quiz.value
                }

                window.api.sendAsync("editQuestion", data);

                window.api.receiveOnce("editQuestionResponse", function () {

                    hideLoadingScreen();

                    acceptParamBtn.className = "unactive";

                    listQuestion();

                })

            }}, {signal: killAllEvent.signal});

        deleteQuestionBTN.addEventListener("click", ev => {

            openModal(
                "Supprimer la question \"" + elem.title + "\" ?",
                "Êtes vous sûr de vouloir supprimez la question s'appelant \"" + elem.title + "\" ?" +
                "<br/>" +
                "<br/>" +
                "<span class='warning'>Vous ne pourrez pas retournez en arrière !</span>",
                {
                    warning: {
                        text: "Oui, je veux supprimer cette question",
                        callback: function (modal, signal) {

                            showLoadingScreen("Suppression de la question en cours, veuillez patienter...");
                            window.api.sendAsync("deleteQuestion", elem.uid);

                            window.api.receiveOnce("deleteQuestionResponse", function () {
                                hideLoadingScreen();
                                modal.style.display = "none";
                                document.getElementById("questionDetailsContainerBack").style.display = "none";
                                listQuestion();
                                ev.stopPropagation();
                                signal.abort();
                                killAllEvent.abort();
                            })

                        }
                    },
                    valid: {
                        text: "Non, retourner en arrière",
                        callback: function (modal, signal) {

                            modal.style.display = "none";

                        }
                    }
                }
            )

        }, {signal: killAllEvent.signal});
    } // EVENT FOR BUTTON

}

function editData(elem, input){
    elem.style.display="none";
    input.value = elem.innerText;
    input.style.display="inline";
    input.focus();
}
function stopEdit(input, elem, value){
    if(input.value !=="" && input.value.length < 30)elem.innerText = input.value;


    input.style.display="none";
    elem.style.display="inline";

}
function checkEdit(input, value){
    let acceptParamBtn = document.getElementById("acceptParam");

    console.log(input, value);

    let checkInput = input.some((i)=>{return i === ""});

    let allSame = input.every((val,index)=>val === value[index]);

    if(!allSame && !checkInput){
        acceptParamBtn.className = "valid";
        console.log("valid");
    } else {
        acceptParamBtn.className = "unactive";
    }

}
