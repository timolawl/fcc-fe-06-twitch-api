// FCC Zipline - Twitch API
// User story 1: See if FCC is streaming
// User story 2: Streamer links to stream
// User story 3: Stream details
// User story 4: Placeholder notification for offline and closed account streamers

'use strict';

// July 1st, 2017: fixed bug that did not sort streamers properly.
// April 13th, 2017: updated to the new API.

// Wrap everything in an IIFE
var twitch = (function() {
  
  var twitchList = ['freecodecamp', 'lirik', 'bobross',  'sirhcez', 'trick2g', 'yogscast', 'nvidia', 'geekandsundry', 'cincinbear', 'summit1g', 'twitchplayspokemon', 'handmade_hero', 'pokimane', 'clintstevens', 'sodapoppin', 'food', 'ESL_SC2', 'OgamingSC2', 'cretetion', 'storbeck', 'habathcx', 'robotcaleb', 'noobs2ninjas', 'brunofin', 'comster404'];
  
  var my = {};
  
  my.processJSONP = function (data) {
    loadStreamerInfo(data);
    
    var name;
    
    if (data.status === 404 || data.status === 422) {
      // extract name
      name = data.message.split(/\"/)[1];
      if (name === twitchList[twitchList.length - 1]) {
        loadTheRest();
      }
      
    }
    
    else if(data.name === twitchList[twitchList.length - 1]) {
      // Start loading the streaming content:
      loadTheRest();
    }
    // If last query via stream API // so the issue is that this last one is loaded before the others: so i need to wait for ALL to load.
    else if(data.stream === null && data._links.self.endsWith(twitchList[twitchList.length - 1])) {
      sortOnlineStreamers();
    }

  };
  
  

  function startTwitchRequest(url, name) {
    // will need to update this to using jsonp to bypass SOP
    
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url + '?callback=twitch.processJSONP';
    document.head.appendChild(script);
  } 

  // Request user's logo and display name
  // Use channel, as this will provide you with information on the status of the account. was channels

  var orderList = [];

  twitchList.forEach(function(twitchName) {
    var apiURL = 'https://wind-bow.gomix.me/twitch-api/users/';
    // twitch API now requires an API key
    // https://api.twitch.tv/kraken/users/
    startTwitchRequest(apiURL + twitchName, twitchName);
  });

  function compare(a, b) {
    if (a.viewCount === 'n/a') return 1;
    else if (b.viewCount === 'n/a') return -1;
    else if (a.viewCount - b.viewCount > 0) {
      return -1;
    }
    else if (a.viewCount - b.viewCount < 0) {
      return 1;
    } else return 0;
    return a.viewCount - b.viewCount;
  }

  function sortOnlineStreamers() {  
    console.log(orderList);
    orderList.sort(compare);

    var parent = document.getElementById('twitch__streams');
    orderList.forEach(function(listItem) {
      var liveStreamer = document.getElementById(listItem.streamer.toLowerCase());
      parent.appendChild(liveStreamer);
    });
  }

  // Query who is currently streaming
  // Window onload to make sure the user information is generated and parsed first before overwritten with stream information.
  // Really has no effect on ajax requests; this simply delays the loading of the following scripts:
  function loadTheRest() {
    // Stream section called one by one because grouping them together does not display all entries. Need this section to determine if the streamer is live. (and whether the account is active)
    twitchList.forEach(function(twitchName) {
      startTwitchRequest("https://wind-bow.gomix.me/twitch-api/streams/" + twitchName, twitchName);
    }); 
  }

  function makeStreamerBlock(name, logo, json) {
      // Create Logo DOM structure
      var logoDiv = document.createElement('div');
      logoDiv.setAttribute("class", "twitch__stream--logo");
      var newLogo = document.createElement('img');
      if(logo) {
        newLogo.src = logo;
      }
      else {
        newLogo.setAttribute("height", "68.8px");
      }
      newLogo.setAttribute("style", "width: 100%");
      logoDiv.appendChild(newLogo);

      // Create Name DOM structure
      var nameDiv = document.createElement('div');
      nameDiv.setAttribute("class", "twitch__stream--name");
      var nameP = document.createElement('p');
      var nameA = document.createElement('a');
      nameA.href = "//www.twitch.tv/" + json.name;
      nameA.target = "_blank";
      var newName = document.createTextNode(name);   
      nameA.appendChild(newName);
      nameP.appendChild(nameA);
      nameDiv.appendChild(nameP);

      // Create Viewcount DOM structure
      var viewcountDiv = document.createElement('div');
      viewcountDiv.setAttribute("class", "twitch__stream--viewcount");
      var viewcountP = document.createElement('p');
      //var newViewcount = document.createTextNode("");
      viewcountP.textContent = 0;
      //viewcountP.appendChild(newViewcount);
      viewcountDiv.appendChild(viewcountP);

      // Create Status DOM structure
      var statusDiv = document.createElement('div');
      statusDiv.setAttribute("class", "twitch__stream--status");
      statusDiv.setAttribute("id", json.name);
      var statusP = document.createElement('p');
      var newStatus = document.createTextNode("Offline");

      statusP.appendChild(newStatus);
      statusDiv.appendChild(statusP);

      // Create Entry (stream entry) DOM structure
      var streamDiv = document.createElement('div');
      streamDiv.setAttribute("class", "twitch__stream");
      streamDiv.setAttribute("id", json.name);
      streamDiv.appendChild(logoDiv);       
      streamDiv.appendChild(nameDiv);
      streamDiv.appendChild(viewcountDiv);
      streamDiv.appendChild(statusDiv);
      document.getElementById('twitch__streams').appendChild(streamDiv);
  }

  function loadStreamerInfo(json) {
    var element, element2, element3, userName;
    // Querying through the stream API
    // If streamer is online:
    if (json.stream) { // if querying through streams and if either undefined (account closed) or null (not streaming), skip this section
      // Stream JSON object
      var streamerGame = json.stream.game;
      var streamerTitle = json.stream.channel.status;   
      var streamerViewcount = json.stream.viewers;
      element = document.getElementById(json.stream.channel.name);
      orderList.push({"streamer": json.stream.channel.name, "viewCount": streamerViewcount});

      element.setAttribute("style", "background-color: #357280");
      //element.className += " streamer-online";
      element2 = element.lastChild.previousSibling;
      element2.innerHTML = streamerViewcount;
      element3 = element.lastChild;
      element3.innerHTML = streamerGame + ": " + streamerTitle;
    }
    
    else {
      // Querying through the user API
      if (json.display_name) {
        // User JSON object
        var streamerLogo = json.logo;
        var streamerName = json.display_name;
        makeStreamerBlock(streamerName, streamerLogo, json);
      }
      else if (json.status === 422 || json.status === 404) { // If the stream/channel is closed
        userName = json.message.split(/\"/)[1];
        //console.log(userName);
        
        orderList.push({"streamer": userName, "viewCount": "n/a"});
        
        makeStreamerBlock(userName, 'http://placehold.it/77x77', {name: userName});
        
        element = document.getElementById(userName);
        element2 = element.lastChild;
        if (json.status === 422) {
          element2.textContent = "Account Closed";
        }
        else if (json.status === 404) {
          element2.textContent = 'User Not Found';
        }
        element.setAttribute("style", "background-color: #212021");

        var parent = document.getElementById('twitch__streams');
        parent.appendChild(element);
      }
      
      else if (json.stream === null && (json.status !== 422 || json.status !== 404)) { // offline
        userName = json._links.self.match(/https:\/\/api\.twitch\.tv\/kraken\/streams\/(.*)/)[1];
        orderList.push({"streamer": userName, "viewCount": "0"});
        
      }
      
    }
  }

  return my;
  
})();

