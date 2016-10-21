var app = angular.module('travelMap', ['ngRoute'])
.config(myRouter)
.controller('Mapping', mapping);

myRouter.$inject =['$routeProvider'];

console.log('test');

function fLoadMap(){
	VMLaunch("ViaMichelin.Api.Map",{
		//Service parameters
		//Map container (DOM element)
		container : $_id("map_container"),
		//Initial geographical coordinates of the map center
		center : { coords : {lon: 8.53, lat: 47.38}},
		//Initial zoom level
		zoom : 11,
		//Display map type selector
		mapTypeControl : true,
		//Display situation map
		situationMapControl : true,
		//Display service POIs selector
		menuPoiControl : true,
		//Display all available service POIs layers
		menuPoiControlOptions:{mode:ViaMichelin.Api.Constants.Map.POI.MODE.ALL}
	}, {//Callbacks
		onInitError: function(){
			alert('Whoops! La carte ne peut pas être chargée!');
		},
		onInit: function(serviceMap){
	        window.myFirstMap = serviceMap;
		},
		//Event listener on the right click of the mouse
		onRightClick: function(event){
			//Display current mouse coordinates
			alert("Current coordinates are (" + event.lon.toFixed(5)  + ', ' + event.lat.toFixed(5) + ')');
		},
		onInitError: function(){
			console.log('No!')
			alert('Whoops!Map cannot be created!');
		},
		onClick: function(event){
			var clickCoords = event;
			//Launch weather search centered on click coords.
			VMLaunch("ViaMichelin.Api.Weather", {
				center : event,
				//Gets 3-day forecast
				nbDays : 3
			},{
				onInitError: function(ref, error){
					alert("onInitError ref: "+ ref +", error: "+ error);
				},
				onError: function(error){
					alert("onError - error: "+ error);
				},
				onSuccess: function(weatherStation){
					if(weatherStation != null){
						//Display weather data
						$_id("dWeatherStationData").innerHTML = "<p>getStationObservation():</p>" + weatherStation.getStationObservation() + "<p>getStationCalendar():</p>" + weatherStation.getStationCalendar() + "<p>getStationForecasts():</p>" + weatherStation.getStationForecasts();
						myMap.removeAllLayers();
						//Plots weather icon, search center icon and link between them
						myMap.addLayer(new ViaMichelin.Api.Map.PolyLine({
							coords: [weatherStation.coords, clickCoords]
						}));
						myMap.addLayer(new ViaMichelin.Api.Map.Marker({
							coords: clickCoords,
							zIndex:3,
							title: "Search center - Weather station: " + Math.round(weatherStation.dist/1000) + "km"
						}));
						myMap.addLayer(weatherStation.getLayer());
						myMap.drawMapFromLayers();
					}else{
						$_id("dWeatherStationData").innerHTML = "Unfortunately, there is no weather station close from this point!";
					}
				}
			});	//VMLaunch
		}
	});
};

function fLaunchSearchIti(){
	//reinitialization
	console.info('Callback fired!', window.myFirstMap);
	window.myFirstMap.removeAllLayers();
	document.getElementById("iti_distance").innerHTML = '';
	//Geocode both departure and arrival cities in a same request
	console.log("itiDistance");
	VMLaunch("ViaMichelin.Api.Geocoding", [//Array of address to geocode
		{city: document.getElementById("departure_city").value, countryISOCode: "CHE"},
		{city: document.getElementById("arrival_city").value, countryISOCode: "CHE"}
	],{//Callbacks
		//Is called when all geocoding have been performed
		onSuccess : function (results) {
			//Store geo coordinates
			var departure_city_coords = results[0][0].coords;
			var arrival_city_coords= results[1][0].coords;
			//Launch standard itinerary computation (recommanded by VM for cars)
			VMLaunch("ViaMichelin.Api.Itinerary", {//Service parameters
				steps:[//Array of Geo coodinates
					{coords: departure_city_coords},
					{coords: arrival_city_coords}
				],
				//Map to display itinerary trace with automatic redraw to fit iti geobounds
				map:{container: $_id("map_container"), focus: true},
				roadsheet : $_id("roadsheet")
			},
			{//Callbacks
				onSuccess : function (result) {
					//Display distance in Km
					console.log("onsuccess");
					document.getElementById("iti_distance").innerHTML = result.header.summaries[0].totalDist/1000 + 'Km';
					iti = result.header.summaries[0];

					var t = iti.totalTime,

						h = Math.floor(t / 3600),

						m = Math.floor(t % 3600 / 60),

					report = "";

					report +=   "Distance : " + iti.totalDist / 1000 + "km";

					report += "\nDuration : " + h + "h " + m + "min";

					report += "\nCost     : " + iti.tollCost.car / 100 + "$";

					output.innerHTML = report;
				},
				onError : function (error) {
					alert('Whoops! ' + error);
				}
			});
			// VMLaunch("ViaMichelin.Api.Completion.Address",
			// 	conf = {
         //   			input : document.getElementById("address")
        	// 	}
			// );
		},
		onError : function (error) {
			alert('Whoops! ' + error);
		}
	});
	//fLaunchSearchIti
}

function myRouter($routeProvider){

	$routeProvider
	.when('/home', {
		templateUrl: './htmltemplates/home.html'
	})
	.when('/about', {
		templateUrl: './htmltemplates/about.html'
	})
	.when('/contact', {
		templateUrl: './htmltemplates/contacts.html'
	})
	// .when('/popular', {
	// 	templateUrl: './htmltemplates/destinations.html'
	// })
	.when('/map', {
		templateUrl: './htmltemplates/map.html',
		controller: "Mapping as map"
	})
	.when('/intro', {
		templateUrl: './htmltemplates/intro.html'
	})
	.otherwise({
		redirectTo: '/'
	});
}

function mapping(){
	console.log('mapping')

	var map = this;
	map.fLaunchSearchIti = fLaunchSearchIti;

	fLoadMap();
}

// jQuery to collapse the navbar on scroll
function collapseNavbar() {
	if ($(".navbar").offset().top > 50) {
		$(".navbar-fixed-top").addClass("top-nav-collapse");
	} else {
		$(".navbar-fixed-top").removeClass("top-nav-collapse");
	}
}
//
$(window).scroll(collapseNavbar);
$(document).ready(collapseNavbar);

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
	$(this).closest('.collapse').collapse('toggle');
});

//Carousel animation

// var carousel = function(){
// 	$('.carousel').carousel({
// 		interval: 2000
// 	});
// }
