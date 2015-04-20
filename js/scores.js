﻿function loadScores() {
    var scoreFileName = $("#hdnFileName").html();
    var fs = require('fs');
    var path = require('path');
    var obj = JSON.parse(fs.readFileSync(path.join('data', scoreFileName), 'utf-8'));
    var scores = obj.scores;
    //var ol = $('<ol/>', {});
    var table = $('<table/>', {
        class:'table table-striped'
    });
    var thead = $('<thead/>', {});
    var theadtr = $('<tr/>', {
    });
    var thnum = $('<th/>', {
        html:'#'
    });
    var thDate = $('<th/>', {
        html:'Date'
    });
    var thScore = $('<th/>', {
        html:'Score'
    });
    var thChart = $('<th/>', {
        html:'Chart'
    });
    theadtr.append(thnum).append(thDate).append(thScore).append(thChart);
    thead.append(theadtr);
    table.append(thead);
    $.each(scores, function (index, item) {
        var lastDateModified = new Date(item.lastModified);
        var tr = $('<tr>', {});
        var tdNum = $('<td/>', {
            html: (index+1).toString()
        });
        var tdDate = $('<td/>', {
            html:lastDateModified.toLocaleDateString()+' '+lastDateModified.toLocaleTimeString()
        });
        var tdScore = $('<td>', {
            html:item.fullScore+'/'+item.fullMaxScore
        });
        var progressBarOutside = $('<div/>', {
            'class':'progress'
        });
        var percentScore = Math.floor((item.fullScore * 100) / item.fullMaxScore);
        var progressBar = $('<div/>', {
            'class':'progress-bar',
            role:'progressbar',
            'aria-valuenow':percentScore,
            'aria-valuemin':'0',
            'aria-valuemax':'100'
        });
        $(progressBar).css('width', percentScore + '%');
        progressBar.append(percentScore+'%');
        progressBarOutside.append(progressBar);
        var tdChart = $('<td/>', {
        });
        tdChart.append(progressBarOutside);
        tr.append(tdNum).append(tdDate).append(tdScore).append(tdChart);
        table.append(tr);
    });
    $("#divScores").append(table);
}

function scores_getParameterByName(name) //courtesy Artem
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