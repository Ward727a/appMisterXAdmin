const {
    contextBridge,
    ipcRenderer
} = require("electron");

const fs = require("fs");

let readedFile = false;
let loader = ""

function readFile(){
    fs.readFile(__dirname+"/model/loading.html", "utf-8", (err, data) => {

        loader = data;

    })
    readedFile = true;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

let validChannelsSend = ["toMain","buttonNewAccount", "askAdminCode", "CheckKey", "changePage", "getAllUsers", "resetPassword", "editUser", "deleteAccount", "stateAccount", "getAllQuiz", "createQuiz", "editQuiz", "removeQuiz", "stateQuiz", "getQuiz", "getAllQuestion","getAllQuestionFrom", "createQuestion", "editQuestion", "deleteQuestion", "askStatusBot", "setupQuiz", "stopQuiz",
    "app_version", "restart_app"];
let validChannelsReceive = ["fromMain","createdAccount", "userListResponse", "resetPasswordResponse", "editUserResponse", "removeAccountResponse", "stateAccountResponse", "getAllQuizResponse", "createQuizResponse", "editQuizResponse", "removeQuizResponse", "stateQuizResponse", "getQuizResponse", "getAllQuestionResponse","getAllQuestionFromResponse", "createQuestionResponse", "editQuestionResponse", "deleteQuestionResponse", "statusBot", "quizSetup", "quizStop",
    "app_version", "update_downloaded", "update_available", "update_error"];

contextBridge.exposeInMainWorld(
    "api", {
        sendSync: (channel, data) => {
            // whitelist channels
            if (validChannelsSend.includes(channel)) {
                return ipcRenderer.sendSync(channel, data);
            }
        },
        sendAsync: (channel, ...args)=>{
            // whitelist channels
            if(validChannelsSend.includes(channel)){
                ipcRenderer.send(channel,...args);
                console.log("Send Async request: "+channel+" args: "+args);
            }
        },
        receive: (channel, func) => {
            if (validChannelsReceive.includes(channel)) {
                // Deliberately strip event as it includes `sender`
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
        receiveOnce: (channel, func) => {
            if (validChannelsReceive.includes(channel)) {
                // Deliberately strip event as it includes `sender`
                ipcRenderer.once(channel, (event, ...args) => func(...args));
            }
        },
        getLoader: () => {
            if(!readedFile) readFile();

            return loader;
        }
    }

);
