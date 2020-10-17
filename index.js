const Alexa = require("ask-sdk-core");
const Intents = require("./customIntents");
//TO DO :                        Change 1
const axios = require('axios');                     //Ye do
const moment = require("moment");                   //Kuch dikkat toh hata do

const timerItem = {
  "duration": "PT25M",
  "timerLabel": "demo",
  "creationBehavior": {
      "displayExperience": {
          "visibility": "VISIBLE"
      }
  },
  "triggeringBehavior": {                           //Ye bhi
      "operation": {
          "type": "ANNOUNCE",
          "textToAnnounce": [
              {
                  "locale": "en-US",
                  "text": "This ends your timer."
              }
          ]
      },
      "notificationConfig": {
          "playAudible": true
      }
  }
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest'
        || (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'              //Ye do line
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'TimerStartIntent'));     //Ye bhi
  },
  handle(handlerInput) {
    const { permissions } = handlerInput.requestEnvelope.context.System.user;                   //Ye sab
    if (!permissions) {
      handlerInput.responseBuilder
        .speak("This skill needs permission to access your timers.")
        .addDirective({
          type: "Connections.SendRequest",
          name: "AskFor",
          payload: {
            "@type": "AskForPermissionsConsentRequest",
            "@version": "1",
            "permissionScope": "alexa::alerts:timers:skill:readwrite"
          },
          token: ""
        });
    } else {
        handlerInput.responseBuilder
          //.speak("would you like to set a timer?")
          //.reprompt("would you like to set a timer?")
          const speakOutput =
            "Welcome, to your code companion. What can I help you with today? You may even set a Pomo Timer here.";
          const soundEffect =
            '<audio src="https://duck-noise.s3.us-east-2.amazonaws.com/quack2.mp3"/>';
          const repromptOutput =
            "Sorry I did not catch that. What would you like to try?";
    }
    return handlerInput.responseBuilder
      .speak(speakOutput + soundEffect)
      .reprompt(repromptOutput)
      .getResponse();
  },
};

// Yaha se

const ConnectionsResponsetHandler = {
  canHandle(handlerInput) {
      return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Connections.Response';
  },
  handle(handlerInput) {
      const { permissions } = handlerInput.requestEnvelope.context.System.user;

      //console.log(JSON.stringify(handlerInput.requestEnvelope));
      //console.log(handlerInput.requestEnvelope.request.payload.status);

      const status = handlerInput.requestEnvelope.request.payload.status;


      if (!permissions) {
          return handlerInput.responseBuilder
              .speak("I didn't hear your answer. This skill requires your permission.")
              .addDirective({
                  type: "Connections.SendRequest",
                  name: "AskFor",
                  payload: {
                      "@type": "AskForPermissionsConsentRequest",
                      "@version": "1",
                      "permissionScope": "alexa::alerts:timers:skill:readwrite"
                  },
                  token: "user-id-could-go-here"
              })
              .getResponse();
      }

      switch (status) {
          case "ACCEPTED":
              handlerInput.responseBuilder
                  .speak("Now that we have permission to set a timer. Would you like to start?")
                  .reprompt('would you like to start?')
              break;
          case "DENIED":
              handlerInput.responseBuilder
                  .speak("Without permissions, I can't set a timer. So I guess that's goodbye.");
              break;
          case "NOT_ANSWERED":

              break;
          default:
              handlerInput.responseBuilder
                  .speak("Now that we have permission to set a timer. Would you like to start?")
                  .reprompt('would you like to start?');
      }

      return handlerInput.responseBuilder
          .getResponse();
  }
};

const YesNoIntentHandler = {
  canHandle(handlerInput) {
      return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
          && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
              || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent');
  },
  async handle(handlerInput) {

      //handle 'yes' utterance
      if (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent') {

          const duration = moment.duration(timerItem.duration),
              hours = (duration.hours() > 0) ? `${duration.hours()} ${(duration.hours() === 1) ? "hour" : "hours"},` : "",
              minutes = (duration.minutes() > 0) ? `${duration.minutes()} ${(duration.minutes() === 1) ? "minute" : "minutes"} ` : "",
              seconds = (duration.seconds() > 0) ? `${duration.seconds()} ${(duration.seconds() === 1) ? "second" : "seconds"}` : "";

          const options = {
              headers: {
                  "Authorization": `Bearer ${Alexa.getApiAccessToken(handlerInput.requestEnvelope)}`,
                  "Content-Type": "application/json"
              }
          };

          await axios.post('https://api.amazonalexa.com/v1/alerts/timers', timerItem, options)
              .then(response => {
                  handlerInput.responseBuilder
                      .speak(`Your ${timerItem.timerLabel} timer is set for ${hours} ${minutes} ${seconds}.`);
              })
              .catch(error => {
                  console.log(error);
              });
      }

      //handle 'no' utterance
      if (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent') {
          handlerInput.responseBuilder
              .speak('Alright I didn\'t start a timer.');
      }

      return handlerInput.responseBuilder
          .getResponse();
  }
};

// Yaha tak new


const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput = "You can say ask me for jokes, quotes , motivation or ask me to set up a study timer for 25 minutes or an hour.";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speakOutput = "Goodbye!";
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "SessionEndedRequest"
    );
  },
  handle(handlerInput) {
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse();
  },
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
    );
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return (
      handlerInput.responseBuilder
        .speak(speakOutput)
        //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        .getResponse()
    );
  },
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${error.stack}`);
    console.log(`handlerInput.requestEnvelope: ${handlerInput.requestEnvelope}`);           //YE NEW HAIIIIIII
    const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    Intents.HelloWorldIntentHandler,
    Intents.jokeIntentHandler,
    Intents.inspireMeIntentHandler,
    Intents.quizIntentHandler,
    Intents.getFactsIntentHandler,
    Intents.adviceIntentHandler,
    Intents.getCommonErrorIntentHandler,
    Intents.progQuoteIntentHandler,
    //Intents.TimerStartIntentHandler,
    ConnectionsResponsetHandler,
    YesNoIntentHandler,                                                   //YE BHI
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  )
  .addErrorHandlers(ErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient())                                            // YE BBHHHIIIIIIIIIII
  .lambda()