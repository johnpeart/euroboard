---
---

const firebaseConfig = {
	apiKey: "AIzaSyBIysVBv-L3HNxbqZSNB5jj-2f6nMdL1KE",
	authDomain: "eurohomeboard.firebaseapp.com",
	databaseURL: "https://eurohomeboard-default-rtdb.firebaseio.com",
	projectId: "eurohomeboard",
	storageBucket: "eurohomeboard.appspot.com",
	messagingSenderId: "1030894746464",
	appId: "1:1030894746464:web:1e377f7e715e4748bafc05"
};

// Initialise Firebase
firebase.initializeApp(firebaseConfig);
// Get a reference to the database service
var database = firebase.database();
var presence = database.ref(".info/connected");

// Countries in each event
const entriesSemiFinal1 = [{% for entry in site.data.entries %}{% if entry.semi-final-one == "TRUE" %}"{{ entry.code }}",{% endif %}{% endfor %}]
const entriesSemiFinal2 = [{% for entry in site.data.entries %}{% if entry.semi-final-two == "TRUE" %}"{{ entry.code }}",{% endif %}{% endfor %}]
const entriesGrandFinal = [{% for entry in site.data.entries %}{% if entry.grand-final == "TRUE" %}"{{ entry.code }}",{% endif %}{% endfor %}];
const entriesFauxFinal = [{% for entry in site.data.entries %}{% if entry.faux-final == "TRUE" %}"{{ entry.code }}",{% endif %}{% endfor %}];

// Variables to feed through to other functions
if(window.location.pathname.indexOf("semi-final-one") != -1) {
	event = "semi-final-one";
	entries = entriesSemiFinal1;
} else if(window.location.pathname.indexOf("semi-final-two") != -1) {
	event = "semi-final-two";
	entries = entriesSemiFinal2;
} else if(window.location.pathname.indexOf("grand-final") != -1) {
	event = "grand-final";
	entries = entriesGrandFinal;
} else {
	event = "faux-final";
	entries = entriesFauxFinal;
}

var loader = document.getElementById("loader");
const settingsData = database.ref('/' + event + '/settings');
const body = document.getElementById("body");
const main = document.getElementById("content");
const scoreboard = document.getElementById("scoreboard--list");
const messageCenter = document.getElementById("message-center");
const messageCenterTitle = document.getElementById("message-center--title");
const messageCenterBody = document.getElementById("message-center--body");

window.onload = function() {
		
	checkPresence();
	
	if(window.location.pathname.indexOf("scoreboard") != -1){
		checkCountryData(event, entries);
		setTimeout(checkTopScore, 5000, event, entries);
		setTimeout(checkSettings, 1000, event);
		setInterval(checkTopScore, 60000, event, entries);
	}
	
}

function startLoader() {
	console.log("📶 Establishing connection. Showing the loading screen...");
	setDataAttribute(body, "connection", false);
	setDataAttribute(loader, "visibility", "visible");
}

function stopLoader() {
	console.log("👻 Connected. Hiding the loading screen...");	
	setDataAttribute(body, "connection", true);
	setTimeout(setDataAttribute, 2000, loader, "visibility", "hidden");
}

function displayElementData(from, to) {
	to.innerText = from;
}

function setDataAttribute(el, attr, value) {
	el.setAttribute('data-' + attr, value);
}

function checkPresence() {
	
	presence.on("value", (snap) => {
		if (snap.val() === true) {
			setTimeout(stopLoader, 2000);
		} else {
			startLoader();
		}
	});
	
}

function checkSettings(event) {
	console.log("⏰ Checking settings...")
	
	settingsData.on('value', (snapshot) => {
		
		let messageTitleData = snapshot.val().messagetitle;
		let messageBodyData = snapshot.val().messagebody;
		let messagesShowData = snapshot.val().messagesshow;
		let messagesPositionData = snapshot.val().messagesposition;
		let layoutData = snapshot.val().layout;
		let calculationData = snapshot.val().calculation;
		
		setDataAttribute(main, "layout", layoutData);
		setDataAttribute(main, "calculation", calculationData);
		setDataAttribute(messageCenter, "messagesshow", messagesShowData);
		setDataAttribute(messageCenter, "messagesposition", messagesPositionData);
		
		// setDataAttribute(messageCenter, "message", messageData);
		displayElementData(messageTitleData, messageCenterTitle);
		displayElementData(messageBodyData, messageCenterBody);
		
	});
	
}

function checkCountryData(event, countries) {
	console.log("⏰ Checking country data...")

	for (i = 0; i < entries.length; i++) {
		
		let country = entries[i];
		let countryData = database.ref('/' + event + '/' + country);
		
		let entry = document.getElementById(country);
		let score = document.getElementById("score-" + country);
		
		countryData.on('value', (snapshot) => {
			
			let scoreData = snapshot.val().vote;
			let countData = snapshot.val().count;
			let nowPlayingData = snapshot.val().nowplaying;
			
			score.dataset.score = scoreData;
			displayElementData(scoreData, score);
			
			entry.dataset.nowplaying = nowPlayingData;
						
		})
		
	};

}

function checkTopScore(event, countries) {
	let allScores = new Array()
	
	for (i = 0; i < entries.length; i++) {
		let country = entries[i];	
		let score = document.getElementById("score-" + country).innerText;
		allScores.push([country, score])
	}
	
	allScores.sort((a,b) => b[1] - a[1]);
	
	let nonZero = 0;
	for (i = 0; i < allScores.length; i++) {
		if (allScores[i][1] > 0) {
			nonZero++;
		}
	}
	
	if (nonZero > 3) {
		console.group("Top scorers");
		for (i = 0; i < allScores.length; i++) {
			let rank = i + 1;
			if (i < 3) {
				console.log("🥇 " + allScores[i][0] + " – " + allScores[i][1] + " points")
			}
			document.getElementById(allScores[i][0]).dataset.leaderboard = rank;
		}
		console.groupEnd();
	} else {
		console.group("Leaderboard");
			console.log("🥇🥈🥉 There aren't enough votes yet...")
			console.info("Scores will update once at least 3 contestants have a non-zero score")
		console.groupEnd();
		document.getElementById(allScores[i][0]).dataset.leaderboard = 0;
	} 
	
}

// When this call is triggered, it will update the score for the country, 
// in a given event or create it if it doesn't exist
function submitVote(event, country, vote) {
	
	// Get the current score for the country
	let countryScore = database.ref('/' + event + '/' + country + '/vote');
	let countryVoteCount = database.ref('/' + event + '/' + country + '/count');
	let points = parseInt(vote);
	let voteButtons = document.getElementsByName("vote-" + country);
	
	countryScore.transaction(
		function(score) {
			return score + points;
		}
	)
	countryVoteCount.transaction(
		function(count) {
			return count + 1;
		}
	)
	
	
	for (i = 0; i < voteButtons.length; i++) {
		voteButtons[i].disabled = true;
	}
}

function setNowPlaying(event, order) {
	
	// Get the current score for the country
	var radios = document.getElementsByName('radioNowPlaying');
	for (var i = 0, length = radios.length; i < length; i++) {
		if (radios[i].checked) {
			// do whatever you want with the checked box
			var country = radios[i].value;
			var nowPlaying = database.ref('/' + event + '/' + country + '/nowplaying');
			
			nowPlaying.transaction(
				function() {
					return true;
				}
			)
			
			if (order == 9) {
				updateSettings('messagesshow', true);
				updateSettings('messagetitle', "Raise a glass to Sir Terry");
				updateSettings('messagebody', "It’s song number 9. Sir Terry Wogan famously warned not to have anything to drink until this point. Grab a drink and raise a glass to his life and contribution to the Contest.");
				
				setTimeout(updateSettings, 120000, 'messagesshow', false);
			}
			
		} else {
			// do whatever you want with the unchecked box
			var country = radios[i].value;
			var nowPlaying = database.ref('/' + event + '/' + country + '/nowplaying');
			
			nowPlaying.transaction(
				function() {
					return false;
				}
			)
		}
	}
	
}

function updateSettings(attr, value) {		
	settingsData.update( {
		[attr]: value
	}, (error) => {
	  if (error) {
		console.warn("⚙️ Update to setting '" + attr + "' failed");
	  } else {
		  console.info("⚙️ '" + attr + "' changed to '" + value + "'");
	  }
	});
}

function pushMessage() {
	let messageTitle = document.getElementById('messageTitle').value;
	let messageBody = document.getElementById('messageBody').value;
	updateSettings('messagetitle', messageTitle);
	updateSettings('messagebody', messageBody);
	
	updateSettings('messagesshow', true);
	setTimeout(updateSettings, 120000, 'messagesshow', false);
}

function resetEventData() {

	let reset = confirm("Do you want to reset all data for this event?");
	if (reset == false) {
	  console.info("💿 Data reset cancelled.")
	} else {
		
	  // Add each country and set everything to zero
	  for (i = 0; i < entries.length; i++) {
		  
		  let country = entries[i];
		  let countryData = database.ref('/' + event + '/' + country);
		  
		  countryData.set({
			  nowplaying: false,
			  count: 0,
			  vote : 0
		  });
		  
	  };
	  
	  // Also add or reset event settings	
	  settingsData.set({
		  messagetitle: "Welcome",
		  messagebody: "Messages will display here throughout the event.",
		  messagesshow: false,
		  messagesposition: "bottom",
		  layout: "performance",
		  calculation: "total",
		  nowplaying: false,
	  }, (error) => {
		if (error) {
		  console.warn("⚙️ Data for " + event + " failed to reset");
		} else {
		  console.info("💿 Data reset for " + event)
		}
	  });
	  
	}
	
	
	
}