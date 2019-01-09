
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion,Image} = require('dialogflow-fulfillment');
const fetch = require('node-fetch');
const url = "https://us-central1-gdgmadevents.cloudfunctions.net/event/";
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
}
async function meetupQuery(agent){
 //Fetch the parsed information from the API
  const data = await fetchInfo();
  agent.add(`Upcoming GDG MAD meet-up is on ${data.date}`);
  //Add a card response using the information
    agent.add(new Card({
             title: `${data.title}`,
             subtitle: `On ${data.date}`,
             imageUrl: `${data.imageUrl}`,
             text: `${data.data}`,
             buttonText: 'RSVP',
             buttonUrl: `https://www.meetup.com/gdg-mad/`
        }));
    agent.add(new Suggestion({
      title:'Venue',
      platform:'ACTIONS_ON_GOOGLE'
    }));
    agent.add(new Suggestion({
      title:'Agenda',
      platform:'ACTIONS_ON_GOOGLE'
    }));
    agent.add(new Suggestion({
      title:'Who are the speakers?',
      platform:'ACTIONS_ON_GOOGLE'
    }));
    //Set context for followup events
    agent.setContext({ name: 'meetup', lifespan: 2, parameters: { agenda: data.agenda,venue_title:data.venue.address.split('\n')[0],venue:data.venue.address, map:data.venue.link}});
}

async function fetchInfo(){

  const page = await fetch("https://us-central1-gdgmadevents.cloudfunctions.net/event/"); //Fetch the API response
  const response =await page.json(); //Parse the response into valid JSON object
  console.log(response);
  var descri = response[0].desc; //Extract the description data from the response
  descri = descri.replace(/<\/?[^>]+>/gi, ''); //Using regex to remove all the html tags
  console.log(descri);
  return {
    //return the extracted information on successful fetching
    title: response[0].name, 
    date: response[0].date,
    data: descri,
    venue : response[0].venue,
    imageUrl: 'https://media.giphy.com/media/DCOgUFTPoCWqGLoyc7/giphy.gif',
    agenda : response[0].agenda
  }
}

 
  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Meetup Query',meetupQuery);
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  agent.handleRequest(intentMap);
});
