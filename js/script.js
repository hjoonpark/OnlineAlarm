let inputMin = document.getElementById("input-min");
let inputSec = document.getElementById("input-sec");
let deleteSingle = document.getElementById("delete-single");
let deleteAll = document.getElementById("delete-all");
let timers = document.getElementById("timers");
let inputStatus = document.getElementById("status");
let startBtn = document.getElementById("start");
let pauseBtn = document.getElementById("pause");
let resumeBtn = document.getElementById("resume");
let stopBtn = document.getElementById("stop");
let repeatChb = document.getElementById("repeat");
let timerCircle = document.querySelector('.circle-fill');
let soundsSelect = document.getElementById("sounds")
let soundIndex = -1;
var audio = null;

const interval = 1000;
var timerData = {currentIndex: -1, secLeft: 0, repeat: false, started: false};
// var counter = null;

window.onload = function(){
    loadSounds();
};
function setCurrentTimer(idx) {
    timerData['currentIndex'] = idx;
    timerData['secLeft'] = parseInt(timers[idx].value);
}
function resumeTimer() {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    resumeBtn.disabled = true;
    pauseBtn.disabled = false;
    startTimer();
}
function pauseTimer() {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    resumeBtn.disabled = false;
    pauseBtn.disabled = true;
    timerData['started'] = false;
    // window.clearTimeout(counter);
    timerWorker.postMessage('pause');
}
function stopTimer() {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    resumeBtn.disabled = false;
    pauseBtn.disabled = true;
    deleteSingle.disabled = false;
    deleteAll.disabled = false;
    timerData['started'] = false;
    colorSelection(-1);
    displayStatus('00:00:00');
    // window.clearTimeout(counter);
    timerWorker.postMessage('pause');
}
timerWorker = new Worker('js/timer.js');
timerWorker.onmessage = function(e) {
    switch(e.data) {
        case 'step':
            step(false);
            break;
    }
}
function startTimer() {
    var totalSecs = [];
    for (var i = 0; i < timers.length; i++) {
        totalSecs.push(parseInt(timers[i].value));
    }
    
    if (timers.length > 0) {
        deleteSingle.disabled = true;
        deleteAll.disabled = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        resumeBtn.disabled = true;
        pauseBtn.disabled = false;
        // start timer
        setCurrentTimer(0);

        startTime = Date.now();
        step(true);
        timerWorker.postMessage('stepEvenInactive');
    }
}
function colorSelection(idx) {
    if (idx < 0) {
        for (let i = 0; i < timers.length; i ++) {
            timers[i].style.backgroundColor = 'white';
            timers[i].style.color = 'black';
        }
    } else {
        timers[idx].style.backgroundColor = 'red';
        timers[idx].style.color = 'white';
    }
    
}
const errMargin = 9; // ms
function step(isInitial) {
    const elapsedTime = Date.now() - startTime;
    if (isInitial || (interval-errMargin <= elapsedTime)) {
        startTime = Date.now();

        timerData['repeat'] = repeatChb.checked;
        timerData['started'] = true;
        const idx = timerData['currentIndex'];
        const secLeft = timerData['secLeft'];
        const nextSecLeft = secLeft-1;
        console.log("elapsedTime: " + elapsedTime + " ms, secLeft: " + secLeft);

        let timeStr = convertHMS(secLeft);
        displayStatus(timeStr);
        colorSelection(-1);

        if (secLeft == 0) {
            console.log("RING");
            // timer finished
            playSound();
            let totalTimeStr = convertHMS(timers[idx].value);
            sendNotification(totalTimeStr + " has finished!");

            if (idx == timers.length - 1) {
                // this was the last one
                if (timerData['repeat']) {
                    // start from 0
                    setCurrentTimer(0);
                } else {
                    // terminate
                    stopTimer();
                    return;
                }
            } else {
                // move to next timer
                setCurrentTimer(idx + 1);
            }
        } else {
            timerData['secLeft'] = nextSecLeft;
        }
        colorSelection(idx);
    }
}
startBtn.onclick = startTimer;
stopBtn.onclick = stopTimer;
pauseBtn.onclick = pauseTimer;
resumeBtn.onclick = resumeTimer;

pauseBtn.onclick = function() {
    pauseBtn.disabled = true;
    startBtn.disabled = false;
}
document.getElementById("add").onclick = function () {
    let min = parseInt(inputMin.value) || 0; // replace nan with 0
    let sec = parseInt(inputSec.value) || 0; // replace nan with 0
    let totalSec = min*60 + sec;

    if (totalSec > 0) {
        let timeStr = [zeroPad(min), zeroPad(sec)].join(":");
        
        let option = document.createElement("option");
        option.text = timeStr;
        option.value = totalSec;
        timers.add(option);
        // clear inputs
        inputMin.value = "";
        inputSec.value = "";
    }
}
deleteSingle.onclick = function() {
    const idx = timers.selectedIndex;
    timers.remove(idx);
}
deleteAll.onclick = function() {
    timers.options.length = 0;
}
inputMin.oninput = function() {
    validateNumber(this);
}
inputSec.oninput = function() {
    validateNumber(this);
}
function validateNumber(input) {
    // remove non-numeric from input
    const val = input.value
    if (!isNaN(val) && !isNaN(parseFloat(val))) {
        // it's only number

    } else {
        // strip number from the input string, and set it back to the input
        let numericVal = val.replace(/\D/g,'');
        input.value = numericVal;
    }

    // only allow max 2 digits for seconds
    if (input.value.length > 2) {
        let newVal = input.value.substring(0, 2);
        input.value = newVal;
    }
}
function zeroPad(v) {
    if ((v+'').length == 1) {
        return '0' + v;
    }
    return v;
}
function displayStatus(str) {
    inputStatus.value = str;
}
function convertHMS(value) {
    const sec = parseInt(value, 10); // convert value to number if it's string
    let hours   = Math.floor(sec / 3600); // get hours
    let minutes = Math.floor((sec - (hours * 3600)) / 60); // get minutes
    let seconds = sec - (hours * 3600) - (minutes * 60); //  get seconds
    // add 0 if value < 10; Example: 2 => 02
    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds; // Return is HH : MM : SS
}


// ------------------------------------------------------------------------
// sounds
// ------------------------------------------------------------------------
soundsSelect.addEventListener('change', loadAndPlaySound);
function loadSounds() {
    // $.getJSON('./sounds', data => {
    //     for (let i = 0; i < data.length; i++) {
    //         fname = data[i].split('.')[0].split('-').join(" ");
    //         fname = capitalizeFirstLetter(fname);
            
    //         let option = document.createElement("option");
    //         option.text = fname;
    //         fullPath = './sounds/' + data[i];
    //         option.value = fullPath;
    //         soundsSelect.add(option);
    //     }
    // });
    data = [
        "doorbell-single-press.wav",
        "alarm-tone.wav",
        "arabian-mystery-harp.wav",
        "arcade-magic.wav",
        "arcade-retro-game-over.wav",
        "bell-notification.wav",
        "classic-short-alarm.wav",
        "clear-announce.wav",
        "clock.wav",
        "coin-win-notification.wav",
        "correct-answer-reward.wav",
        "elevator.wav",
        "female-astonished-gasp.wav",
        "game-reveal.wav",
        "happy-bells.wav",
        "interface-option-select.wav",
        "little-cute-kiss.wav",
        "magic-marimba.wav",
        "magic-notification-ring.wav",
        "martial-arts-fast-punch.wav",
        "musical-alert.wav",
        "musical-reveal.wav",
        "positive-notification.wav",
        "retro-game-notification.wav",
        "sci-fi-reject.wav",
        "sick-man-sneeze.wav",
        "software-interface-back.wav",
        "software-interface-remove.wav",
        "software-interface-start.wav",
        "tropical-forest-bird-chirp.wav",
        "trumpet-fanfare.wav",
        "wild-lion-animal-roar.wav",
        "wrong-answer-fail.wav",
    ].sort();
    for (let i = 0; i < data.length; i++) {
        fname = data[i].split('.')[0].split('-').join(" ");
        fname = capitalizeFirstLetter(fname);
        
        let option = document.createElement("option");
        option.text = fname;
        fullPath = './sounds/' + data[i];
        option.value = fullPath;
        soundsSelect.add(option);
    }

    const fPath = soundsSelect[0].value;
    audio = new Audio(fPath);
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function loadAndPlaySound() {
    const idx = soundsSelect.selectedIndex;
    if (soundIndex != idx) {
        soundIndex = idx;
        const fPath = soundsSelect[idx].value;
        audio = new Audio(fPath);
    }
    playSound();
}
function playSound() {
    audio.pause();
    audio.currentTime = 0;
    audio.play();
}
function sendNotification(txt){
    if (window.Notification && Notification.permission === "granted") {
        var i = 0;
        // Using an interval cause some browsers (including Firefox) are blocking notifications if there are too much in a certain time.
        // Thanks to the tag, we should only see the "Hi! 9" notification
        var n = new Notification(txt);
    } else if (window.Notification && Notification.permission !== "denied") {
        Notification.requestPermission(function (status) {
            // If the user said okay
            if (status === "granted") {
                var i = 0;
                var n = new Notification(txt);
            }
        });
    }
}