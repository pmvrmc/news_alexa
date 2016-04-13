'use strict';

const request = require('request');
const cheerio = require('cheerio');
const cheerio = require('./config');

const URL = 'https://en.wikipedia.org/wiki/Main_Page';
const APPLICATION_ID = config.applicationId;
const NEWS_REGEX = /(\d+)\s.\s(.+)/;

exports.handler = function (event, context) {
    if (event.session.application.applicationId !== APPLICATION_ID) {
        return context.fail("Invalid Application ID");
    }

    if (event.request.type === "LaunchRequest") {
        return onLaunch(event.request, event.session, (speechletResponse) => {
            context.succeed(buildResponse(speechletResponse));
        });
    }
    if (event.request.type === "IntentRequest" && event.request.intent.name === 'AMAZON.HelpIntent') {
        return onHelp(event.request, event.session, (speechletResponse) => {
            context.succeed(buildResponse(speechletResponse));
        });
    }
};


function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);
    return getHistoricalFacts(callback);
}

function onHelp(helpRequest, session, callback) {
    console.log("onHelp requestId=" + helpRequest.requestId + ", sessionId=" + session.sessionId);
    return callback(buildSpeechletResponse('This is Today\'s Historical Facts. Just say \'Ask for today\'s facts\' and hear them out!'));
}

// --------------- Functions that control the skill's behavior -----------------------

function getHistoricalFacts(callback) {
    request(url, (error, response, html) => {
        let $ = cheerio.load(html);
        let topNews = [];
        $('#mp-otd').find('li').each((liIndx, li)=> {
          topNews.push($(li).text());
        });
        topNews = topNews.splice(0,3);

        let myNews = [];
        topNews.forEach((news) => {
          let a = news.match(NEWS_REGEX);
          myNews.push('On ' + a[1] + '. ' + a[2]);
        });

        return callback(buildSpeechletResponse(myNews.join(' ')));
    });
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(output) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        shouldEndSession: true
    };
}

function buildResponse(speechletResponse) {
    return {
        version: "1.0",
        response: speechletResponse
    };
}
