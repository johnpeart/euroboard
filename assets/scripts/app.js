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

// Countries in each event
const entriesSemiFinal1 = [{% for entry in site.data.entries %}{% if entry.semi-final-one == "TRUE" %}"{{ entry.code }}",{% endif %}{% endfor %}]
const entriesSemiFinal2 = [{% for entry in site.data.entries %}{% if entry.semi-final-two == "TRUE" %}"{{ entry.code }}",{% endif %}{% endfor %}]
const entriesGrandFinal = [{% for entry in site.data.entries %}{% if entry.grand-final == "TRUE" %}"{{ entry.code }}",{% endif %}{% endfor %}];
const entriesFauxFinal = [{% for entry in site.data.entries %}{% if entry.faux-final == "TRUE" %}"{{ entry.code }}",{% endif %}{% endfor %}];

// Loaders
var loadingScreen = document.getElementById("loading-screen");
var loader = document.getElementById("loader");

window.onload = function() {
	if(window.location.pathname.indexOf("scoreboard") != -1){
		
		console.log("Retrieve initial data...");
		
		// Show the animation to hide the UI
		startLoader();
		
		// checkScores("faux-final", "AUS");
		// checkScores("faux-final", "FRA");
		// checkScores("faux-final", "GBR");
		if(window.location.pathname.indexOf("semi-final-one") != -1) {
			event = "semi-final-one";
			entries = entriesSemiFinal1;
		}
		if(window.location.pathname.indexOf("semi-final-two") != -1) {
			event = "semi-final-two";
			entries = entriesSemiFinal2;
		}
		if(window.location.pathname.indexOf("grand-final") != -1) {
			event = "grand-final";
			entries = entriesGrandFinal;
		}
		if(window.location.pathname.indexOf("faux-final") != -1) {
			event = "faux-final";
			entries = entriesFauxFinal;
		}

		checkScores(event, entries);
		
		// Show the UI
		stopLoader();
		
	} else {
		console.log("Loading page...");
		
		// Show the animation to hide the UI
		startLoader();
		
		// Show the UI
		setTimeout(stopLoader, 1000);
	}
}

function fadeElement(el) {
	el.classList.add("fade-out");
}

function removeElement(el) {
	el.style.display = "none";
}

function startLoader() {
	
	console.log("⏰ Starting the loading screen...");
	loader.classList.remove("hidden");
	loader.classList.add("grow");
	
}

function stopLoader() {
	
	loader.classList.remove("grow");
	loader.classList.add("shrink");
	
	setTimeout(fadeElement, 500, loadingScreen);
	setTimeout(removeElement, 1000, loadingScreen);
	
	console.log("✅ Loading screen stopped.");
	
}

function checkScores(event, countries) {
	console.log("⏰ Checking scores...")
	for (i = 0; i < entries.length; i++) {
		checkScore(event, entries[i]);
	}
	console.log("✅ Scores checked.")
}

function checkScore(event, country) {
	var currentScore = firebase.database().ref('/' + event + '/' + country + '/vote');
	var uiScore = document.getElementById("score-" + country);
	
	currentScore.on('value', (snapshot) => {
		
		console.group("Checking scores for " + country);
		console.log('⏰ Attempting to get score for ' + country)
		
		const data = snapshot.val();
		uiScore.innerHTML = data;
		
		console.log('✅ Score for ' + country + ' changed. New score: ' + data);
		console.groupEnd();
	  
	});
	
}

// When this call is triggered, it will update the score for the country, 
// in a given event or create it if it doesn't exist
function submitVote(event, country, vote) {
	
	// Get the current score for the country
	var countryScore = firebase.database().ref('/' + event + '/' + country + '/vote');
	var countryCount = firebase.database().ref('/' + event + '/' + country + '/count');
	var points = parseInt(vote);
	var uiVoteButtons = document.getElementsByName("vote-" + country);
	
	countryScore.transaction(
		function(score) {
			return score + points;
		}
	)
	countryCount.transaction(
		function(count) {
			return count + 1;
		}
	)
	
	for (i = 0; i < uiVoteButtons.length; i++) {
		uiVoteButtons[i].disabled = true;
	}
}