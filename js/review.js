﻿function review_showWordBoxes(jsonFileName) {
    var items = window.items;
    var elCanvas = document.getElementById("cvsImage");
    $.each(items, function (index, obj) {
        var value = obj.item;
        var id = parseInt(value['id']);
        if ($.inArray(id, window.answeredItemsIds) === -1) {
            var lines = value['lines'];
            var disabled = value['disabled'];
            if (disabled !== '1') {
                var ctx = elCanvas.getContext("2d");
                ctx.beginPath();
                $.each(lines, function (index1, lineItem) {
                    var point1X = lineItem['line'][0];
                    var point1Y = lineItem['line'][1];
                    var point2X = lineItem['line'][2];
                    var point2Y = lineItem['line'][3];
                    if (index1 === 0) {
                        //to make sure you dont jump off the canvas
                        //to draw the next line
                        ctx.moveTo(point1X, point1Y);
                    }
                    ctx.lineTo(point2X, point2Y);

                });
                ctx.closePath();
                ctx.fillStyle = '#FFFFFF';
                ctx.stroke();
                ctx.fill();
            }
        }
    });
}

function review_reloadImageFromFile() {
    var jsonFileName = review_getJsonFileNameFromHiddenField();
    review_showWordBoxes(jsonFileName);
}

function relMouseCoords(event) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;

    do {
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while (currentElement === currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return { x: canvasX, y: canvasY }
}


HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

function loadJsonInMemory() {
    var jsonFileName = review_getJsonFileNameFromHiddenField();
    var fs = require('fs');
    var obj = JSON.parse(fs.readFileSync(getFullPath(jsonFileName), 'utf-8'));
    var itemList = [];
    $.each(obj['items'], function(index, value) {
        var disabled = value.item.disabled;
        if (disabled !== '1') {
            itemList.push(value);
        }
    });
    window.items = itemList;
    window.lastModified = obj['lastModified'];
    window.answeredItemsIds = [];
    window.answeredItemScores = [];
    window.answeredItemMaxScores = [];
    window.answeredItems = [];
}

function saveScore(totalScore, maxScore) {
    var totalSeconds = Math.floor((new Date() - window.startTime)/1000);
    var jsonFileName = review_getJsonFileNameFromHiddenField();
    var scoreFileName = jsonFileName.replace('file_', 'score_');
    var fs = require('fs');
    var obj = JSON.parse(fs.readFileSync(getFullPath(scoreFileName), 'utf-8'));
    var scores = obj['scores'];
    var score = new Object();
    score.totalSeconds = totalSeconds;
    score.lastModified = Date.now();
    score.fullScore = totalScore;
    score.fullMaxScore = maxScore;
    score.itemScores = [];
    var answeredItemsIds = window.answeredItemsIds;
    var answeredItems = window.answeredItems;
    var answeredItemScores = window.answeredItemScores;
    var answeredItemMaxScores = window.answeredItemMaxScores;
    $.each(answeredItemsIds, function(index, value) {
        var itemid = value;
        var itemScore = answeredItemScores[index];
        var itemMaxScore = answeredItemMaxScores[index];
        var answer = answeredItems[index];
        var itemScoreObj = new Object();
        itemScoreObj.itemid = itemid;
        itemScoreObj.answer = answer;
        itemScoreObj.score = itemScore;
        itemScoreObj.maxscore = itemMaxScore;
        score.itemScores.push(itemScoreObj);
    });
    scores.push(score);
    var jsonToWrite = JSON.stringify(obj, null, 4);
    fs.writeFile(getFullPath(scoreFileName), jsonToWrite, function(err) {
        if (err)
            alert(err);
    });
}

function highlightClickedArea(canvasX, canvasY) {
    var items = window.items;
    var elCanvas = document.getElementById("cvsImage");
    $.each(items, function (index, obj) {
        var value = obj.item;
        var id = parseInt(value['id']);
        if ($.inArray(id, window.answeredItemsIds) === -1) {
            var disabled = value['disabled'];
            if (disabled !== '1') {
                var lines = value['lines'];
                var ctx = elCanvas.getContext("2d");
                ctx.beginPath();
                var vertX = [];
                var vertY = [];
                $.each(lines, function (index1, lineItem) {
                    var point1X = lineItem['line'][0];
                    var point1Y = lineItem['line'][1];
                    var point2X = lineItem['line'][2];
                    var point2Y = lineItem['line'][3];
                    vertX.push(point1X);
                    vertY.push(point1Y);
                    if (index1 === 0) {
                        //to make sure you dont jump off the canvas
                        //to draw the next line
                        ctx.moveTo(point1X, point1Y);
                    }
                    ctx.lineTo(point2X, point2Y);
                });
                if (pnpoly(4, vertX, vertY, canvasX, canvasY)) {
                    window.penalty = 0;
                    window.hintNumber = 0;
                    window.hintPosArray = [];
                    $("#btnSubmit").prop("disabled", false);
                    $("#btnHint").prop("disabled", false);
                    $("#divHint").html('');
                    $("#divPenalty").html('');
                    ctx.fillStyle = '#adff2f';
                    $("#hdnAnswer").html(value['answer']);
                    $("#hdnHint").html(value['hint']);
                    $("#hdnItemId").html(value['id']);
                    $("#hdnDateModified").html(window.lastModified);
                } else {
                    ctx.fillStyle = '#FFFFFF';
                }
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
            }
        }
    });
}

function showHint() {
    var availableIndices = [];
    var actualAnswer = $("#hdnAnswer").html();
    var allChars = actualAnswer.split('');
    $.each(allChars, function (index, value) {
        if ($.inArray(index, window.hintPosArray) === -1) {
            availableIndices.push(index);
        }
    });
    var displayString = '';
    if (window.hintNumber === 0) {
        $.each(allChars, function (index, value) {
            if ($.inArray(index, window.hintPosArray) === -1) {
                displayString += '_ ';
            } else {
                displayString += value + ' ';
            }
        });
        $("#divHint").html(displayString);
        window.hintNumber = 1;
    } else {
        var randomPos = Math.floor(Math.random() * availableIndices.length);
        var randomIndex = availableIndices[randomPos];
        window.hintPosArray.push(randomIndex);
        $.each(allChars, function(index, value) {
            if ($.inArray(index, window.hintPosArray) === -1) {
                displayString += '_ ';
            } else {
                displayString += value + ' ';
            }
        });
        $("#divHint").html(displayString);
    }
    if (availableIndices.length > 0) {
        window.penalty += 1;
    }
    $("#divPenalty").html('Penalty: ' + window.penalty.toString());
}

String.prototype.replaceArray = function (find, replace) {
    var replaceString = this;
    for (var i = 0; i < find.length; i++) {
        replaceString = replaceString.replace(find[i], replace[i]);
    }
    return replaceString;
};

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function preselect() {
    var items = window.items;
    items = shuffle(items);
    var elCanvas = document.getElementById("cvsImage");
    var midX = 0;
    var midY = 0;
    $.each(items, function(index, obj) {
        var value = obj.item;
        var id = parseInt(value['id']);
        if ($.inArray(id, window.answeredItemsIds) === -1) {
            var lines = value['lines'];
            var disabled = value['disabled'];
            if (disabled !== '1') {
                var ctx = elCanvas.getContext("2d");
                ctx.beginPath();
                var vertX = [];
                var vertY = [];
                $.each(lines, function (index1, lineItem) {
                    var point1X = lineItem['line'][0];
                    var point1Y = lineItem['line'][1];
                    var point2X = lineItem['line'][2];
                    var point2Y = lineItem['line'][3];
                    if (point1X !== point2X) {
                        midX = Math.floor((point1X + point2X) / 2);
                    }
                    if (point1Y !== point2Y) {
                        midY = Math.floor((point1Y + point2Y) / 2);
                    }
                    vertX.push(point1X);
                    vertY.push(point1Y);
                    if (index1 === 0) {
                        //to make sure you dont jump off the canvas
                        //to draw the next line
                        ctx.moveTo(point1X, point1Y);
                    }
                    ctx.lineTo(point2X, point2Y);
                });
            }
        }
    });
    highlightClickedArea(midX, midY);
}

function submitAnswer() {
    var actualAnswer = $("#hdnAnswer").html();
    var givenAnswer = $("#answer").val();
    var dist = levDist(actualAnswer.toLowerCase(), givenAnswer.toLowerCase());
    if (dist < 0) {
        dist = 0;
    }
    var lastDateModified = new Date(+$("#hdnDateModified").html());
    var numDays = parseInt((Date.now()- lastDateModified) / (24 * 3600 * 1000));
    var scalingFactor = Math.floor(Math.log(numDays+1)/Math.log(2))+1;
    window.answeredItemsIds.push(parseInt($("#hdnItemId").html()));
    var givenAnswerScoreLength = givenAnswer.trim().length;
    if (givenAnswerScoreLength > actualAnswer.length) {
        givenAnswerScoreLength = actualAnswer.length;
    }
    var currItemScore = parseInt((scalingFactor * givenAnswerScoreLength) - Math.floor((scalingFactor * 0.75) * (dist + penalty)));
    if (currItemScore < 0) currItemScore = 0;
    var currItemMaxScore = parseInt(actualAnswer.length * scalingFactor);
    window.answeredItemScores.push(currItemScore);
    window.answeredItemMaxScores.push(currItemMaxScore);
    window.answeredItems.push(actualAnswer);
    window.itemScoreTotal += currItemScore;
    window.itemMaxScoreTotal += currItemMaxScore;
    var li = $('<li/>', {
        html: actualAnswer + ' Max Score: ' + currItemMaxScore.toString() + '  Your score: '+ currItemScore.toString()
    });
    $("#divLastAnswer").html('Your answer: ' + givenAnswer + ' Actual answer: ' + actualAnswer);
    $("#divCurrFullScore").html('Last answer score: ' + currItemScore.toString() + '/' + currItemMaxScore.toString()+' Current score: '+itemScoreTotal.toString()+'/'+itemMaxScoreTotal.toString());
    var percentAnswered = Math.floor(window.answeredItemsIds.length * 100 / window.items.length);
    $("#progressBar").css('width', percentAnswered + "%");
    $("#progressText").html(window.answeredItemsIds.length + '/' + window.items.length + ' items answered');
    $("#lstAnswers").append(li);
    $("#answer").val('');
    review_reloadImageFile();
    if (window.items.length === window.answeredItemsIds.length) {
        //all items answered, calculate full score
        $("#divFinalScore").html('Total score: '+window.itemScoreTotal.toString()+"/"+window.itemMaxScoreTotal.toString());
        saveScore(window.itemScoreTotal, window.itemMaxScoreTotal);
        $("#answer").prop("disabled", true);
    }
    $("#btnSubmit").prop("disabled", true);
    $("#btnHint").prop("disabled", true);
}

//http://www.merriampark.com/ld.htm, http://www.mgilleland.com/ld/ldjavascript.htm, Damerau–Levenshtein distance (Wikipedia)
var levDist = function (s, t) {
    var d = []; //2d matrix

    // Step 1
    var n = s.length;
    var m = t.length;

    if (n === 0) return m;
    if (m === 0) return n;

    //Create an array of arrays in javascript (a descending loop is quicker)
    for (var i = n; i >= 0; i--) d[i] = [];

    // Step 2
    for (var i = n; i >= 0; i--) d[i][0] = i;
    for (var j = m; j >= 0; j--) d[0][j] = j;

    // Step 3
    for (var i = 1; i <= n; i++) {
        var s_i = s.charAt(i - 1);

        // Step 4
        for (var j = 1; j <= m; j++) {

            //Check the jagged ld total so far
            if (i == j && d[i][j] > 4) return n;

            var t_j = t.charAt(j - 1);
            var cost = (s_i == t_j) ? 0 : 1; // Step 5

            //Calculate the minimum
            var mi = d[i - 1][j] + 1;
            var b = d[i][j - 1] + 1;
            var c = d[i - 1][j - 1] + cost;

            if (b < mi) mi = b;
            if (c < mi) mi = c;

            d[i][j] = mi; // Step 6

            //Damerau transposition
            if (i > 1 && j > 1 && s_i === t.charAt(j - 2) && s.charAt(i - 2) === t_j) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
            }
        }
    }

    // Step 7
    return d[n][m];
}



function review_getJsonFileNameFromHiddenField() {
    return $("#hdnFileName").html() + ".json";
}

function review_getImageFileName(jsonFileName) {
    var fs = require('fs');
    var path = require('path');
    var obj = JSON.parse(fs.readFileSync(getFullPath(jsonFileName), 'utf-8'));
    var imageFileName = obj['fileName'];
    return imageFileName;
}

function review_reloadImageFile() {
    var path = require('path');
    var jsonFileName = review_getJsonFileNameFromHiddenField();
    var imageFileName = review_getImageFileName(jsonFileName);
    var dirName = getDirectoryFromFileName(jsonFileName);
    var fullFileName = path.join("data",dirName, imageFileName);
    Caman("#cvsImage", fullFileName, function () {
        // manipulate image here
        //this.brightness(5).render();
        this.render();
        var canvasHeight = $("#cvsImage").height();
        var canvasWidth = $("#cvsImage").width();
        $("#sliderLeft").height(canvasHeight);
        $("#sliderRight").height(canvasHeight);
        $("#sliderTop").width(canvasWidth);
        $("#sliderBottom").width(canvasWidth);
        $("#sliderLeft").slider({
            max: $("#cvsImage").height()
        });
        $("#sliderRight").slider({
            max: $("#cvsImage").height()
        });
        $("#sliderTop").slider({
            max: $("#cvsImage").width()
        });
        $("#sliderBottom").slider({
            max: $("#cvsImage").width()
        });
        review_showWordBoxes(jsonFileName);
        preselect();
    });
}

Date.prototype.yyyymmddHHMMss = function () {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
    var dd = this.getDate().toString();
    var HH = (this.getHours()).toString();
    var MM = this.getMinutes().toString();
    var ss = this.getSeconds().toString();
    return yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]) + (HH[1] ? HH : "0" + HH[0]) + (MM[1] ? MM : "0" + MM[0]) + (ss[1] ? ss : "0" + ss[0]); // padding
};

function getParameterByName(name) //courtesy Artem
{
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null)
        return "";
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function newImage() {
    $("#lstAnswers").html('');
}

Array.max = function (array) {
    return Math.max.apply(Math, array);
};

Array.min = function (array) {
    return Math.min.apply(Math, array);
};