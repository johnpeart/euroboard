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
// // Enable logging across page refreshes
// firebase.database.enableLogging(true, true);
var database = firebase.database();
var presence = database.ref(".info/connected");

// Countries in each event
const entriesSemiFinal1 = ["AUS","AZE","BEL","CRO","CYP","EIR","ISR","LTU","MLT","MKD","NOR","ROU","RUS","SVN","SWE","UKR",]
const entriesSemiFinal2 = ["ALB","AUT","BGR","CZE","DEN","EST","FIN","GEO","GRE","ISL","LAT","MDA","POL","POR","SMR","SRB","SUI",]
const entriesGrandFinal = ["AZE","BEL","CYP","FRA","GER","ISR","ITA","LTU","MLT","NED","NOR","RUS","ESP","SWE","UKR","GBR",];
const entriesFauxFinal = ["AUS","AZE","BEL","BGR","CRO","DEN","EST","FRA","GER","ISL","ITA","LAT","LTU","MLT","NED","MKD","NOR","POR","ROU","SMR","SRB","SVN","ESP","SWE","SUI","GBR",];

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

	presence.on("value", (snap) => {
		if (snap.val() === true) {
			setTimeout(stopLoader, 2000);
		} else {
			startLoader();
		}
	});

	if(window.location.pathname.indexOf("scoreboard") != -1){
		setTimeout(checkCountryData, 1000, event, entries);
		setTimeout(checkTopScore, 10000, event, entries);
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

function checkSettings(event) {
	console.log("⏰ Checking settings...")

	settingsData.on('value', (snapshot) => {

		var messageTitleData = snapshot.val().messagetitle;
		var messageBodyData = snapshot.val().messagebody;
		var messagesShowData = snapshot.val().messagesshow;
		var messagesPositionData = snapshot.val().messagesposition;
		var layoutData = snapshot.val().layout;
		var calculationData = snapshot.val().calculation;

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

		let entryElement = document.getElementById(country);
		let totalPointsElement = document.getElementById("total-points-" + country);
		let averagePointsElement = document.getElementById("average-points-" + country);

		console.log("Event: " + event + ". Country: " + country)

		countryData.on('value', (snapshot) => {

			var scoreData = snapshot.val().vote;
			var countData = snapshot.val().count;
			if (scoreData / countData > 0) {
				var averageData = Math.round(scoreData / countData)
				if (averageData == 11) {
					var averageData = 12;
				}
				if (averageData == 9) {
					var averageData = 10;
				}
			} else {
				var averageData = 0
			}
			var nowPlayingData = snapshot.val().nowplaying;

			entryElement.dataset.score = scoreData;
			entryElement.dataset.count = countData;
			displayElementData(scoreData, totalPointsElement);
			displayElementData(averageData, averagePointsElement);

			entryElement.dataset.nowplaying = nowPlayingData;

		})

	};

}

function checkTopScore(event, countries) {
	var allScores = new Array();

	for (i = 0; i < entries.length; i++) {
		let country = entries[i];
		let points = document.getElementById("total-points-" + country).innerText;
		allScores.push([country, points])
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
		for (i = 0; i < allScores.length; i++) {
			document.getElementById(allScores[i][0]).dataset.leaderboard = 0;
		}
	}

}

// When this call is triggered, it will update the score for the country,
// in a given event or create it if it doesn't exist
function submitVote(event, country, vote) {

	// Get the current score for the country
	var countryData = database.ref('/' + event + '/' + country);
	var points = parseInt(vote);
	var voteButtons = document.getElementsByName("vote-" + country);

	var voteConfirm = confirm("You are voting for " + country + ". \nYou are awarding " + vote + " points. \n\nYou can only vote one. Do you want to confirm your vote?");

	if (voteConfirm == true) {
		countryData.transaction(
			function(data) {
				if (data) {
					var currentVotes = data.vote;
					var currentCount = data.count;
					data['vote'] = currentVotes + points;
					data['count'] = currentCount + 1;
				}
				return data;
			},
			function(error, committed, snapshot) {
				console.group("You voted");
				if (error) {
					console.log('Transaction failed abnormally!', error);
					alert("You can't vote whilst the event isn't taking place.")
				} else if (!committed) {
					console.log('Your vote wasn’t counted. Sorry.');
				} else {
					console.log('You gave ' + points + ' points to ' + country);
					console.log(snapshot.val().count + ' other people have awarded points to ' + country)
					for (i = 0; i < voteButtons.length; i++) {
						voteButtons[i].disabled = true;
					}
				}
				console.groupEnd();
			}
		);
	} else {

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

			if (event == "semi-final-two") {

				if (order == 1) {
					messagetitle = "Senhit from San Marino opening the show";
					messagebody = "This is a high adrenaline number featuring none other than Flo Rida! Senhit has revealed that part of her staging is meant to reference the female reproductive system. No, I don't know why either.";
				}

				if (order == 2) {
					messagetitle = "Uku look stunning";
					messagebody = "Estonia's entry, Uku Siveste, was apparently recently voted as the country's hottest man. Does he get your douze points too?";
				}

				if (order == 3) {
					messagetitle = "Oh my god!";
					messagebody = "It's time for song number 3 already: Benny Cristo with ”Omaga”, representing the Czech Republic.";
				}

				if (order == 4) {
					messagetitle = "Now you see me...";
					messagebody = "... Now you don't! Look out for some inventive and abundant use of green screen in this entry from Greece.";
				}

				if (order == 5) {
					messagetitle = "Is this what you wanted?";
					messagebody = "Well, is it? Did you want a ballad about relationship breakdown for Eurovision? Tough. You're getting it anyway.";
				}

				if (order == 6) {
					messagetitle = "Back to 80s";
					messagebody = "Standby for brash synths and an excess of pyrotechnics in Poland's entry.";
				}

				if (order == 7) {
					messagetitle = "Got a sweet tooth?";
					messagebody = "I hope so, because Moldova is bringing you some sugar.";
				}

				if (order == 8) {
					messagetitle = "Interuptted by Covid";
					messagebody = "Iceland's entry has been forced into isolation due to a positive Covid test result amongst their delegation. We'll be watching a pre-record now, and if they make it through to the final, the same pre-record will be used them too.";
				}

				if (order == 9) {
					messagetitle = "Hold on to your hats.";
					messagebody = "Here comes a Hurricane to drive you Loco Loco.";
				}

				if (order == 10) {
					messagetitle = "Nap time.";
					messagebody = "Wake me up in three minutes and 45 seconds...";
				}

				if (order == 11) {
					messagetitle = "20 years in the making.";
					messagebody = "This is apparently Anxhela’s second attempt at getting to Eurovision – her first was in 2001. She got here. Good for her. After a 20 year wait though, all I can think is: what a waste of an opening!";
				}

				if (order == 12) {
					messagetitle = "It's a kind of magic...";
					messagebody = "This is one of the few performances to feature the gigantic see-through screen that's been built especially for the contest. It's a pretty cool effect. Not magic; just technology.";
				}

				if (order == 13) {
					messagetitle = "Growing Up is Getting Old";
					messagebody = "I hear you, VICTORIA. After 3 minutes of listening to this, you might feel like you've aged a decade too.";
				}

				if (order == 14) {
					messagetitle = "Do not “put your middle fingers up” at Eurovision ";
					messagebody = "Finland's entry have, despite their lyrics, been expressly told not to put their middle fingers up. This is a family friendly show kids; even if you're a rock band.";
				}

				if (order == 15) {
					messagetitle = "The Blood Moon Is Rising";
					messagebody = "No, this isn't the new theme tune for the next Legend of Zelda installment. (I highly recommend Breath of the Wild, if you haven't played it, though).";
				}

				if (order == 16) {
					messagetitle = "Throwing some shapes";
					messagebody = "The rehearsals for this track have triggered a wave of memes. The dancing does seem a bit out of place, but  the vocals will be exceptional!";
				}

				if (order == 17) {
					messagetitle = "To me. To you.";
					messagebody = "This is very camp and very 80s. It’s as if an synth-ladden chart-topper got smushed with opening credits of Chucklevision.";
				}

				updateSettings('messagesshow', false);
				setTimeout(function() {
					updateSettings('messagesshow', true);
					updateSettings('messagetitle', messagetitle);
					updateSettings('messagebody', messagebody);
				}, 3000);

			}

			if (event == "grand-final") {

				if (order == 1) {

				}

				if (order == 2) {

				}

				if (order == 3) {

				}

				if (order == 4) {

				}

				if (order == 5) {

				}

				if (order == 6) {

				}

				if (order == 7) {

				}

				if (order == 8) {

				}

				if (order == 9) {
					messagetitle = "Raise a glass to Sir Terry";
					messagebody = "It’s song number 9. Sir Terry Wogan famously warned not to have anything to drink until this point. Grab a drink and raise a glass to his life and contribution to the Contest.";
				}

				if (order == 10) {

				}

				if (order == 11) {

				}

				if (order == 12) {

				}

				if (order == 13) {

				}

				if (order == 14) {

				}

				if (order == 15) {

				}

				if (order == 16) {

				}

				if (order == 17) {

				}

				if (order == 18) {

				}

				if (order == 19) {

				}

				if (order == 20) {

				}

				if (order == 21) {

				}

				if (order == 22) {

				}

				if (order == 23) {

				}

				if (order == 24) {

				}

				if (order == 25) {

				}

				if (order == 26) {

				}

				updateSettings('messagesshow', false);
				setTimeout(function() {
					updateSettings('messagesshow', true);
					updateSettings('messagetitle', messagetitle);
					updateSettings('messagebody', messagebody);
				}, 3000);

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

	var messageTitle = document.getElementById('messageTitle').value;
	var messageBody = document.getElementById('messageBody').value;

	updateSettings('messagesshow', false);

	setTimeout(function() {
		updateSettings('messagetitle', messageTitle);
		updateSettings('messagebody', messageBody);
		updateSettings('messagesshow', true);
	}, 3000)

}

function resetEventData() {

	var reset = confirm("Do you want to reset all data for this event?");
	if (reset == false) {
	  console.info("💿 Data reset cancelled.")
	} else {

	  // Add each country and set everything to zero
	  for (i = 0; i < entries.length; i++) {

		  var country = entries[i];
		  var countryData = database.ref('/' + event + '/' + country);

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