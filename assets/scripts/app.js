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
	
	// Show the animation to hide the UI
	startLoader();
	
	if(window.location.pathname.indexOf("scoreboard") != -1){
		checkScores(event, entries)
		setTimeout(checkTopScore, 5000, event, entries)		
		setInterval(checkTopScore, 60000, event, entries)		
	}

	// Show the UI
	setTimeout(stopLoader, 2000);
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
	
}

function failLoader() {
	alert('failed')
}

function checkNowPlaying(event, country) {
	var currentEntry = database.ref('/' + event + '/' + country + '/now-playing');
	var uiEntry = document.getElementById(country);
	
	currentEntry.on('value', (snapshot) => {
				
		const data = snapshot.val();
		if (data == true) {
			uiEntry.dataset.nowplaying = true;
			console.log('▶️ Now playing: ' + country);
		} else {
			uiEntry.dataset.nowplaying = false;
		}
		
	});
	
}

async function checkScores(event, countries) {
	console.log("⏰ Checking scores...")

	for (i = 0; i < entries.length; i++) {
		
		let country = entries[i];
		let currentScore = database.ref('/' + event + '/' + country + '/vote');
		let uiScore = document.getElementById("score-" + country);
		
		currentScore.on('value', (snapshot) => {
			const data = snapshot.val();
			uiScore.innerHTML = data;
			console.log('✅ Score for ' + country + ' changed. New score: ' + data);			
		})
		
		checkNowPlaying(event, country);
		
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
	
	var nonZero = 0;
	for (i = 0; i < allScores.length; i++) {
		if (allScores[i][1] > 0) {
			nonZero++;
		}
	}
	
	if (nonZero > 3) {

		var uiEntry = document.getElementsByClassName("scoreboard--list--entry");

		console.group("Top scorers");
		for (i = 0; i < 3; i++) {
			let rank = i + 1;
			console.log("🥇 " + allScores[i][0] + " – " + allScores[i][1] + " points")
			document.getElementById(allScores[i][0]).dataset.leaderboard = rank;
		}
		console.groupEnd();
		
	} else {

		console.group("Leaderboard");
			console.log("🥇🥈🥉 There aren't enough votes yet...")
			console.info("Scores will update once at least 3 contestants have a non-zero score")
		console.groupEnd();
	} 
	
}

// When this call is triggered, it will update the score for the country, 
// in a given event or create it if it doesn't exist
function submitVote(event, country, vote) {
	
	// Get the current score for the country
	var countryScore = database.ref('/' + event + '/' + country + '/vote');
	var points = parseInt(vote);
	var uiVoteButtons = document.getElementsByName("vote-" + country);
	
	countryScore.transaction(
		function(score) {
			return score + points;
		}
	)
	
	
	for (i = 0; i < uiVoteButtons.length; i++) {
		uiVoteButtons[i].disabled = true;
	}
}

function setNowPlaying(event) {
	
	// Get the current score for the country
	var radios = document.getElementsByName('radioNowPlaying');
	for (var i = 0, length = radios.length; i < length; i++) {
		if (radios[i].checked) {
			// do whatever you want with the checked box
			var country = radios[i].value;
			var nowPlaying = database.ref('/' + event + '/' + country + '/now-playing');
			
			nowPlaying.transaction(
				function() {
					return true;
				}
			)
			
		} else {
			
			// do whatever you want with the unchecked box
			var country = radios[i].value;
			var nowPlaying = database.ref('/' + event + '/' + country + '/now-playing');
			
			nowPlaying.transaction(
				function() {
					return false;
				}
			)
		}
	}
	
}