const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');
const store = new Store();

const path = require('path')
const https = require('https')


const io = require("socket.io-client");
const socket = io("https://bot-misterx.herokuapp.com");


let adminKey = "";

let mainWindows;
let keyWindow;

let botStatus = null

autoUpdater.on('error', (err)=>{
    mainWindows.webContents.send('update_error', err);
})

autoUpdater.on('update-available', () => {
    mainWindows.webContents.send('update_available');
});
autoUpdater.on('update-downloaded', () => {
    mainWindows.webContents.send('update_downloaded');
});

function getCacheKey(){

    if(store.get("key") !== undefined){
    adminKey = store.get("key");
    return adminKey;
    } else {
        return "NOKEY"
    }
}

function verifyKey(adminKey, start = false, justTest = false, callback = function () {}){

    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/admin/check?adminKey="+adminKey,
        method: "GET",
        headers:{
            "content-type": 'application/json'
        }
    }

    console.log(options.path);
    const req = https.request(options, res=>{
        //console.log('Status code: '+res.statusCode);

        let data = ''

        res.on('data', args => {
            data+=args;
        })

        res.on('end', ()=>{

            if(JSON.parse(data).ResultCode === 1) {
                //console.log("Code OK");
                callback(true);
                return true;
            } else {
                if(JSON.parse(data).ResultCode === 2){
                    if(!start) return false;
                    if(start){
                        if(!justTest) {
                            mainWindows.loadFile("askKey.html");
                        } else {
                            //console.error("Code not true");
                            callback(false);
                        }
                    }
                } else {
                    if(!justTest) {
                        if (!mainWindows.destroyed) {
                            mainWindows.loadFile("askKey.html");
                        }
                    } else {
                        //console.error("Code not exist");
                    }
                    callback(false);
                    return false;
                }
            }
        })

        //console.log("REQ");
    })

    req.end();

    req.on('error', error => {
        console.error(error)
    })
}

function createKeyWindow(){
    keyWindow = new BrowserWindow({
        width: 400,
        height: 200,
        autoHideMenuBar: true,
        resizable: false,
        webPreferences:{
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, "preload.js"), // use a preload script
            nativeWindowOpen: true
        }
    })
    keyWindow.loadFile('askKey.html');
}

function createWindow(){
    mainWindows = new BrowserWindow({
        width: 800,
        height: 400,
        autoHideMenuBar: true,
        webPreferences:{
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, "preload.js"), // use a preload script
            nativeWindowOpen: true
        }
    })

    mainWindows.loadFile('index.html');

    mainWindows.once("ready-to-show", ()=>{
        autoUpdater.checkForUpdatesAndNotify();
    })

}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    verifyKey(getCacheKey(), true, false);


})
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})
ipcMain.on('buttonNewAccount', async function (ipc, data, options) {

    const req = https.request(options, res=>{
        console.log('Status code: '+res.statusCode);
    });

    req.on('error', error => {
        console.error(error)
    })

    data.adminKey = adminKey;

    console.log(adminKey);

    console.log(data);

    req.write(JSON.stringify(data))
    req.end()

    req.on('response', response => {
        mainWindows.webContents.send("createdAccount", response.statusCode);
    })

});
ipcMain.on("askAdminCode", function (ipc, ...args) {
   ipc.returnValue = "TESTReturn";
});
ipcMain.on("CheckKey", async function (ipc, ...args){
    console.log(args[0]);
    verifyKey(args[0], false, true, function (arg) {

        console.log(arg);

        if(arg){
            store.set("key", args[0])
            mainWindows.loadFile("index.html");
        } else {
            console.log("Code not valid");
        }
    });

})
ipcMain.on("changePage", function (ipc, ...args) {
    let page = args[0];

    switch (page){
        case "index":
            mainWindows.loadFile("index.html");
            break;
        case "quiz":
            mainWindows.loadFile("quiz.html");
            break;
        case "question":
            mainWindows.loadFile("question.html");
            break;
        default:
            console.error("Page asked: "+page);
            break;
    }
})
ipcMain.on("getAllUsers", function (ipc, ...args) {


    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/user/getAll?adminKey="+getCacheKey(),
        method: "GET",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options, res=>{
        console.log('Status code: '+res.statusCode);

        let data = "";

        res.on('data', chunk => {
            data+=chunk;
        });

        res.on("end", () => {
            mainWindows.webContents.send("userListResponse", data);
        })
    })

    req.end();


})
ipcMain.on("resetPassword", function (ipc, uid, retry){

    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/user/change",
        method: "POST",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options, res=>{

    });

    let data = {

        "adminKey": adminKey,
        "resetPassword": true,
        "uid": uid

    }

    req.write(JSON.stringify(data));

    req.end();

    req.on("response", response => {

        let returnData = "";

        response.on("data", chunk => {

            returnData += chunk;

        })

        response.on("end", () => {

            returnData = JSON.parse(returnData);

            console.log();

            mainWindows.webContents.send("resetPasswordResponse", Boolean(returnData.ResultCode), retry);
        })


    })

});
ipcMain.on("editUser", function (ipc, uid, username){

    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/user/change",
        method: "POST",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options, res=>{

    });

    let data = {

        "adminKey": adminKey,
        "username": username,
        "uid": uid,

    }

    req.write(JSON.stringify(data));

    req.end();

    req.on("response", response => {

        let returnData = "";

        response.on("data", chunk => {

            returnData += chunk;

        })

        response.on("end", () => {

            returnData = JSON.parse(returnData);

            console.log(returnData);

            if(returnData.ResultCode === 1) {
                mainWindows.webContents.send("editUserResponse");
            } else {

                console.error(returnData.message);

            }
        })


    })

});
ipcMain.on("deleteAccount", function (ipc, uid){

    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/user/remove",
        method: "POST",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options, res=>{

    });

    let data = {

        "adminKey": adminKey,
        "uid": uid,

    }

    req.write(JSON.stringify(data));

    req.end();
    console.log(data);

    req.on("response", response => {

        let returnData = "";

        response.on("data", chunk => {

            returnData += chunk;

        })

        response.on("end", () => {

            returnData = JSON.parse(returnData);

            console.log(returnData);

            if(returnData.ResultCode === 1) {
                mainWindows.webContents.send("removeAccountResponse");
            } else {

                console.error(returnData);

            }
        })


    })

})
ipcMain.on("stateAccount", function (ipc, uid, state){


    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/user/state",
        method: "POST",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options, res=>{

    });

    let data = {

        "adminKey": adminKey,
        "uid": uid,
        "state": state

    }

    req.write(JSON.stringify(data));

    req.end();
    console.log(data);

    req.on("response", response => {

        let returnData = "";

        response.on("data", chunk => {

            returnData += chunk;

        })

        response.on("end", () => {

            returnData = JSON.parse(returnData);

            console.log(returnData);

            if(returnData.ResultCode === 1) {
                mainWindows.webContents.send("stateAccountResponse");
            } else {

                console.error(returnData);

            }
        })


    })

})
ipcMain.on("getAllQuiz", function (ipc, ...args) {


    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/quiz/getAll?key="+getCacheKey(),
        method: "GET",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options, res=>{
        console.log('Status code: '+res.statusCode);

        let data = "";

        res.on('data', chunk => {
            data+=chunk;
        });

        res.on("end", () => {
            mainWindows.webContents.send("getAllQuizResponse", data);
        })
    })

    req.end();


})
ipcMain.on("createQuiz", function (ipc, title){

    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/quiz",
        method: "POST",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options);

    let data = {
        "UIDAuthor": adminKey,
        "title": title
    };

    req.write(JSON.stringify(data));

    req.end();

    req.on("response", response => {

        let responseData = "";

        response.on("data", chunk=>{

            responseData+=chunk;

        })


        response.on("end", () => {

            console.log(responseData);
            responseData = JSON.parse(responseData);

            mainWindows.webContents.send("createQuizResponse", responseData.ResultCode);

        })

    })

})
ipcMain.on("editQuiz", function (ipc, uid, title){

    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/quiz/change",
        method: "POST",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options, res=>{

    });

    let data = {

        "key": adminKey,
        "title": title,
        "uid": uid,

    }

    req.write(JSON.stringify(data));

    req.end();

    req.on("response", response => {

        let returnData = "";

        response.on("data", chunk => {

            returnData += chunk;

        })

        response.on("end", () => {

            returnData = JSON.parse(returnData);

            console.log(returnData);

            if(returnData.ResultCode === 1) {
                mainWindows.webContents.send("editQuizResponse");
            } else {

                console.error(returnData.message);

            }
        })


    })

});
ipcMain.on("removeQuiz", function (ipc, uid){

    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/quiz/remove",
        method: "POST",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options, res=>{

    });

    let data = {

        "key": adminKey,
        "uid": uid,

    }

    req.write(JSON.stringify(data));

    req.end();
    console.log(data);

    req.on("response", response => {

        let returnData = "";

        response.on("data", chunk => {

            returnData += chunk;

        })

        response.on("end", () => {

            returnData = JSON.parse(returnData);

            console.log(returnData);

            if(returnData.ResultCode === 1) {
                mainWindows.webContents.send("removeQuizResponse");
            } else {

                console.error(returnData);

            }
        })


    })

})
ipcMain.on("stateQuiz", function (ipc, uid, state){


    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/quiz/state",
        method: "POST",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options, res=>{

    });

    let data = {

        "key": adminKey,
        "uid": uid,
        "state": state

    }

    req.write(JSON.stringify(data));

    req.end();
    console.log(data);

    req.on("response", response => {

        let returnData = "";

        response.on("data", chunk => {

            returnData += chunk;

        })

        response.on("end", () => {

            returnData = JSON.parse(returnData);

            console.log(returnData);

            if(returnData.ResultCode === 1) {
                mainWindows.webContents.send("stateQuizResponse");
            } else {

                console.error(returnData);

            }
        })


    })

})
ipcMain.on("getQuiz", function (event, uid){

    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/quiz?key="+adminKey+"&uid="+uid,
        method: "GET",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options, res=>{

        let returnData = "";

        res.on("data", chunk => {

            returnData += chunk;

        })

        res.on("end", () => {

            returnData = JSON.parse(returnData);

            if(returnData.ResultCode === 1 && returnData.exist) {
                mainWindows.webContents.send("getQuizResponse", returnData.quiz);
            } else {

                console.error(returnData);

            }
        })
    });

    req.end();

})
ipcMain.on("getAllQuestion", function (ipc, ...args) {


    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/question/getAll?key="+getCacheKey(),
        method: "GET",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options, res=>{
        console.log('Status code: '+res.statusCode);

        let data = "";

        res.on('data', chunk => {
            data+=chunk;
        });

        res.on("end", () => {
            mainWindows.webContents.send("getAllQuestionResponse", data);
        })
    })

    req.end();


})
ipcMain.on("getAllQuestionFrom", function (ipc, quiz){

    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/question/from?key="+adminKey,
        method: "GET",
        headers:{
            "content-type": 'application/json'
        }
    }

    let data = {
        uidQuiz: quiz
    }

    const req = https.request(options, res=>{
        console.log('Status code: '+res.statusCode);
    })

    req.write(JSON.stringify(data));

    console.log(data);

    req.end();

    req.on("response", (res)=>{

        let data = "";

        res.on('data', chunk => {
            data+=chunk;
        });

        res.on("end", () => {
            if(JSON.stringify(data).ResultCode === 1) {
                mainWindows.webContents.send("getAllQuestionFromResponse", data);
            } else {
                console.error(data);
            }
        })
    })
})
ipcMain.on("createQuestion", function (ipc, data){


    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/question",
        method: "POST",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options);

    data.UIDAuthor = adminKey;

    console.table(data);

    data = JSON.stringify(data);

    req.write(data);

    req.end();

    req.on("response", ()=>{
        mainWindows.webContents.send("createQuestionResponse", true);
    })


})
ipcMain.on("editQuestion", (ipc, data)=>{

    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/question/change",
        method: "POST",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options);

    data.key = adminKey;

    let dataJSON = JSON.stringify(data);

    req.write(dataJSON);

    req.end()

    req.on("response", ()=>{
        mainWindows.webContents.send("editQuestionResponse");
    })

})
ipcMain.on("deleteQuestion", (ipc, uid)=>{

    let options = {
        hostname: "misterx-94495.herokuapp.com",
        path: "/app/question/remove",
        method: "POST",
        headers:{
            "content-type": 'application/json'
        }
    }

    const req = https.request(options, res=>{

    });

    let data = {

        "key": adminKey,
        "uid": uid,

    }

    req.write(JSON.stringify(data));

    req.end();
    console.log(data);

    req.on("response", response => {

        let returnData = "";

        response.on("data", chunk => {

            returnData += chunk;

        })

        response.on("end", () => {

            returnData = JSON.parse(returnData);

            console.log(returnData);

            if(returnData.ResultCode === 1) {
                mainWindows.webContents.send("deleteQuestionResponse");
            } else {

                console.error(returnData);

            }
        })


    })

})
ipcMain.on('askStatusBot', (ipc)=>{

    console.log("askStatusBot");
    let timer;
    let interval;
    const socketTimeout = (onSuccess, onTimeout, timeout) => {
        let called = false;

        timer = setTimeout(() => {
            if (called) return;
            called = true;
            onTimeout();
        }, timeout);

        return (...args) => {
            if (called) return;
            called = true;
            clearTimeout(timer);
            onSuccess.apply(this, args);
        }
    }
    check();

    function check() {

        mainWindows.webContents.send("statusBot", "loading");

        socket.emit("askStatus", socketTimeout(() => {
        }, () => {
            mainWindows.webContents.send("statusBot", false);
        }, 5000));


        socket.on("status", () => {
            mainWindows.webContents.send("statusBot", true);
            botStatus = true;
            clearTimeout(timer);
        })
    }

})
ipcMain.on('setupQuiz', (ipc, uid)=>{

    console.log("setupQuiz");
    let timer;
    const socketTimeout = (onSuccess, onTimeout, timeout) => {
        let called = false;

        timer = setTimeout(() => {
            if (called) return;
            called = true;
            onTimeout();
        }, timeout);

        return (...args) => {
            if (called) return;
            called = true;
            clearTimeout(timer);
            onSuccess.apply(this, args);
        }
    }
    check();

    function check() {

        socket.emit("setupQuiz", uid, socketTimeout(() => {
        }, () => {
            mainWindows.webContents.send("quizSetup", uid);
        }, 5000));


        socket.on("quizSetup", () => {
            mainWindows.webContents.send("quizSetup", uid);
            clearTimeout(timer);
        })
    }

})
ipcMain.on('stopQuiz', (ipc, uid)=>{

    console.log("stopQuiz");
    let timer;
    const socketTimeout = (onSuccess, onTimeout, timeout) => {
        let called = false;

        timer = setTimeout(() => {
            if (called) return;
            called = true;
            onTimeout();
        }, timeout);

        return (...args) => {
            if (called) return;
            called = true;
            clearTimeout(timer);
            onSuccess.apply(this, args);
        }
    }
    check();

    function check() {

        socket.emit("stopQuiz", uid, socketTimeout(() => {
        }, () => {
            mainWindows.webContents.send("quizStop", uid);
        }, 5000));


        socket.on("quizStop", () => {
            mainWindows.webContents.send("quizStop", uid);
            clearTimeout(timer);
        })
    }

})

ipcMain.on('app_version', (event) => {
    console.log(app.getVersion());
    mainWindows.webContents.send('app_version', app.getVersion());
});

ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
});
