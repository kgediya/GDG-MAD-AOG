
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Payload,Card, Suggestion,Image} = require('dialogflow-fulfillment');
const fetch = require('node-fetch');
const url = "https://raw.githubusercontent.com/kgediya/GDG-MAD-AOG/master/test-api.json";
const gifs = ["https://media.giphy.com/media/4Nq9NNTuIlMnm/giphy-downsized-large.gif","https://media.giphy.com/media/LoX8yc1ngPCvu/giphy.gif","https://media.giphy.com/media/DCOgUFTPoCWqGLoyc7/giphy.gif","https://media.giphy.com/media/l0IybIP1xUDwcY7Kw/giphy.gif"];
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
  //Compute the timestamp at which and the action is invoke and check if meet-up is scheduled or not
  if(data.timestamp>new Date().getTime()){
  agent.add(`Upcoming GDG MAD meet-up is on ${data.date}`);
  
  //Add a card response using the information
    agent.add(new Card({
             title: `${data.title}`,
             subtitle: `On ${data.date}`,
             imageUrl: `${data.imageUrl}`,
             text: `${data.data}`,
             buttonText: 'RSVP',
             buttonUrl: `${data.meetupUrl}`
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
    agent.setContext({ name: 'meetup', lifespan: 4, parameters: { agenda: data.agenda,speaker1:data.agenda[0].speaker,speaker2:data.agenda[1].speaker,speaker3:data.agenda[2].speaker,venue_title:data.venue.address.split('\n')[0],venue:data.venue.address, map:data.venue.link}});
  }else {
    //Generate random gif_id to provide random gifs url to card from our gifs variable
    var gif_id = Math.floor(Math.random()*gifs.length);
    agent.add(`Sorry no new meet-up is scheduled for now. You can view our past meetups on our Meetups.com page!`);
    agent.add(new Card({
      title: `GDG MAD`,
      subtitle: `GDG Mumbai Application Developers Group`,
      imageUrl: `${gifs[gif_id]}`,
      text: `GDG MAD is a monthly meetup in Mumbai, that aims to bring the developer community together to learn, teach, discuss, share, and most importantly, form lasting connections. We're one big, welcoming bunch, all backgrounds, genders, skill levels and outlooks invited.
      `,
      buttonText: 'VISIT',
      buttonUrl: `https://www.meetup.com/gdg-mad/`
 }));
  }
  }
async function agendaQuery(agent){
  const a11yText = 'Google Assistant Bubbles';
const googleUrl = 'https://google.com';

  agent.add("This is test response");
  const data = await fetchInfo();
  agent.add(new Payload(agent.ACTIONS_ON_GOOGLE,{
    "expectUserResponse": true,
    "richResponse": {
      "items": [
        {
          "simpleResponse": {
            "textToSpeech": "Inspiring People on the way!",
            "displayText":"Here are the speakers for the day"
          }
        },
        {
          "carouselBrowse": {
            "items": [ 
              {
                "title": `${data.agenda[0].speaker.name}`,
                "openUrlAction": {
                  "url": `https://twitter.com/${data.agenda[0].speaker.twitter}`
                },
                "description": `${data.agenda[0].name}`,
                "footer": `${data.agenda[0].start}-${data.agenda[0].end}`,
                "image": {
                  "url": `https://avatars.io/twitter/${data.agenda[0].speaker.twitter}`,
                  "accessibilityText": "Google Assistant Bubbles"
                }
              },
              {
                "title": `${data.agenda[1].speaker.name}`,
                "openUrlAction": {
                  "url": `https://twitter.com/${data.agenda[1].speaker.twitter}`
                },
                "description": `${data.agenda[1].name}`,
                "footer": `${data.agenda[1].start}-${data.agenda[1].end}`,
                "image": {
                  "url": `https://avatars.io/twitter/${data.agenda[1].speaker.twitter}`,
                  "accessibilityText": "Google Assistant Bubbles"
                }
              },
              {
                "title": `${data.agenda[2].speaker.name}`,
                "openUrlAction": {
                  "url": `https://twitter.com/${data.agenda[2].speaker.twitter}`
                },
                "description": `${data.agenda[2].name}`,
                "footer": `${data.agenda[2].start}-${data.agenda[2].end}`,
                "image": {
                  "url": `https://avatars.io/twitter/${data.agenda[2].speaker.twitter}`,
                  "accessibilityText": "Google Assistant Bubbles"
                }
              }
            ]
          }
        }
      ]
    },
    "userStorage": "{\"data\":{}}"
  }));
}
async function fetchInfo(){

  const page = await fetch("https://raw.githubusercontent.com/kgediya/GDG-MAD-AOG/master/test-api.json"); //Fetch the API response
  const response =await page.json(); //Parse the response into valid JSON object
  console.log(response);
  var descri = response[0].desc; //Extract the description data from the response
  descri = descri.replace(/<\/?[^>]+>/gi, ''); //Using regex to remove all the html tags
  console.log(descri);
  return {
    //return the extracted information on successful fetching
    title: response[0].name, 
    date: response[0].date,
    timestamp: response[0].time,
    data: descri,
    venue : response[0].venue,
    imageUrl: response[0].img_link,
    agenda : response[0].agenda,
    meetupUrl: response[0].meetup_link
  }
}

 
  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Meetup Query',meetupQuery);
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Speaker Query',agendaQuery);
  intentMap.set('Default Fallback Intent', fallback);
  agent.handleRequest(intentMap);
});
