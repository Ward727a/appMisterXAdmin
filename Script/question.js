/*async function testString(){

    const domeditable = document.getElementsByClassName("ck-content")[0];

    const editorInstance = await domeditable.ckeditorInstance;

    console.log(await editorInstance.getData());

}
*/

let questionArray = [];
let quizArray = [];

function listQuiz(_callback){

    let firstUID;

    let list = document.getElementById("quizSelector");

    window.api.sendAsync("getAllQuiz");


    window.api.receiveOnce("getAllQuizResponse", async function (data){
        showLoadingScreen("Chargement des données...");

        let promises = [];

        list.innerHTML = "";

        let dataJSON = JSON.parse(data);

         dataJSON.data.forEach(elem=>{
             promises.push( new Promise((resolve => {
                 quizArray.push(elem);

                 if(firstUID==="") firstUID = elem.uid;

                 let option = document.createElement("option");

                 option.innerText = elem.title;
                 option.value = elem.uid;

                 list.appendChild(option);
             })
             ))

        })

        Promise.all(promises).then(()=>{
            _callback();
        });


        let number = document.getElementById("quizNumber");
        let valid = document.getElementById("quizValid");

        window.api.sendAsync("getQuiz", list.value);

        window.api.receiveOnce("getQuizResponse", function (quiz) {

            hideLoadingScreen();

            number.innerText = quiz.number;

            valid.innerHTML = quiz.valid? "<span class='valid'>Oui</span>":"<span class='warning'>Non</span>";

        })

    })

    list.addEventListener("change", function () {

        let number = document.getElementById("quizNumber");
        let valid = document.getElementById("quizValid");

        showLoadingScreen("Chargement des données du quiz...");

        window.api.sendAsync("getQuiz", list.value);

        window.api.receiveOnce("getQuizResponse", function (quiz) {

            hideLoadingScreen();

            number.innerText = quiz.number;

            valid.innerHTML = quiz.valid? "<span class='valid'>Oui</span>":"<span class='warning'>Non</span>";

        })

    })

}

async function listQuestion(){

    let questionList = document.getElementById("questionList");
    questionList.innerHTML = "";

    questionArray = [];

    async function load(questionArrayElement){

        let template = document.getElementById("templateContainerQuestion").content.cloneNode(true);

        let question = questionArrayElement;

        let box = template.querySelector(".box")

        let title = template.querySelector(".title");
        let author = template.querySelector(".author");
        let order = template.querySelector(".order");

        let shortcut = template.querySelector(".deleteShortcut");

        title.innerText = question.title;
        author.innerText = question.author;
        order.innerText = question.order;

        title.addEventListener("click", ()=>{

            openQuestionDetails(question);

        })

        shortcut.addEventListener("click", ()=>{

            listQuestion();

        })

        await questionList.append(template);

        box.style.opacity = "100%";
    }

    window.api.sendAsync("getAllQuestion");

    window.api.receiveOnce("getAllQuestionResponse", async function (data) {

        let dataJSON = JSON.parse(data);

        let list = document.getElementById("quizSelectorSearch");

        list.innerHTML = ""

        let optionDefault = document.createElement("option");
        optionDefault.innerText = "Aucun";
        optionDefault.value = "default";
        list.appendChild(optionDefault);


        for (let quizArrayElement of quizArray) {

            let option = document.createElement("option");

            option.innerText = quizArrayElement.title;
            option.value = quizArrayElement.uid;

            list.appendChild(option);

        }

        for (let i = 0; i < dataJSON.length; i++) {
            let template = document.getElementById("templateContainerQuestion").content.cloneNode(true);

            let question = dataJSON.data[i];

            questionArray.push(question);

            let box = template.querySelector(".box")

            let title = template.querySelector(".title");
            let author = template.querySelector(".author");
            let order = template.querySelector(".order");

            let shortcut = template.querySelector(".deleteShortcut");

            title.innerText = question.title;
            author.innerText = question.author;
            order.innerText = question.order;


            title.addEventListener("click", ()=>{

                openQuestionDetails(question);

            })

            shortcut.addEventListener("click", ()=>{

                deleteQuesiton(question.uid)

            })
            box.style.marginLeft = "-20vw";

            await questionList.append(template);



            box.style.opacity = "100%";
            box.style.marginLeft = "0";


        }

        list.addEventListener("change", async function (){

            questionList.innerHTML = "";

            let value = list.value;

            if(value === "default"){

                for (let questionArrayElement of questionArray) {
                    load(questionArrayElement);
                }

            } else {
                for (let questionArrayElement of questionArray) {
                    if(questionArrayElement.quiz === value) {

                        load(questionArrayElement);

                    }
                }
            }

        })

    })

}

async function createQuestion(){
    const domEditable = document.getElementsByClassName("ck-content")[0];
    const editorInstance = await domEditable.ckeditorInstance;

    let questionTitle = document.getElementById("questionTitleInput").value;
    let question = await editorInstance.getData();
    let questionResponse = document.getElementById("questionResponseInput").value;
    let questionCounter = document.getElementById("questionCounterInput").value;
    let questionQuiz = document.getElementById("quizSelector").value;

    if(questionTitle !== "" && question !== "" && questionResponse !== "" && questionCounter !== "" && questionQuiz !== ""){

        showLoadingScreen("Création de la question, veuillez patienter...");

        let data = {
            title: questionTitle,
            name: question,
            response: questionResponse,
            falseResponse: questionCounter,
            uidQuiz: questionQuiz
        }

        let order = 0;

        quizArray.forEach(value => {

            if(value.uid === questionQuiz){
                order = value.number;
            }

        })

        data.order = order;

        window.api.sendAsync("createQuestion", data);

        window.api.receiveOnce("createQuestionResponse", function (success) {

            if(success){
                hideLoadingScreen();

                listQuestion();
            }

        })

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

listQuiz(listQuestion());


function deleteQuesiton(uid){

    window.api.sendAsync("deleteQuestion", uid);

    window.api.receiveOnce("deleteQuestionResponse", ()=>{

        listQuestion();

    })

}
