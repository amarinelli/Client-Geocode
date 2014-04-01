$(function() {
	var icons = {
		header : "ui-icon-circle-arrow-e",
		activeHeader : "ui-icon-circle-arrow-s"
	};

	//            if (var active = $("#accordion").accordion("option", "active"))
	//            {
	//                var elemLegend = document.getElementById("legend");
	//                elemLegend.setAttribute("style", "max-height:450px");
	//            }

	$("#accordion").accordion({
		icons : icons,
		active : false,
		collapsible : true,
		heightStyle : "content",
		header : "h3"
	}).sortable({
		axis : "y",
		handle : "h3",
		stop : function(event, ui) {
			// IE doesn't register the blur when sorting
			// so trigger focusout handlers to remove .ui-state-focus
			ui.item.children("h3").triggerHandler("focusout");
		}
	});
	$("#from").datepicker({
		defaultDate : "+1w",
		showOn : "button",
		buttonImage : "WebSite\\Images\\iconCalendar.gif",
		buttonImageOnly : true,
		changeMonth : true,
		changeYear : true,
		//showButtonPanel: true,
		changeMonth : true,
		numberOfMonths : 1,
		onClose : function(selectedDate) {
			$("#to").datepicker("option", "minDate", selectedDate);
		}
	});
	$("#to").datepicker({
		defaultDate : "+1w",
		showOn : "button",
		buttonImage : "WebSite\\Images\\iconCalendar.gif",
		buttonImageOnly : true,
		changeMonth : true,
		changeYear : true,
		//showButtonPanel: true,
		changeMonth : true,
		numberOfMonths : 1,
		onClose : function(selectedDate) {
			$("#from").datepicker("option", "maxDate", selectedDate);
		}
	});
});

var map, locator, geocoder;

require(["esri/map",
	"esri/config",
	 
	"esri/dijit/Scalebar", 
	"esri/dijit/HomeButton", 
	"esri/dijit/Geocoder", 
	"esri/dijit/LocateButton", 
	"esri/dijit/BasemapToggle", 
	"esri/tasks/locator",
	 
	"esri/graphic", 
	"esri/InfoTemplate", 
	"esri/symbols/SimpleMarkerSymbol", 
	"esri/symbols/SimpleLineSymbol", 
	"esri/symbols/Font", 
	"esri/symbols/TextSymbol", 
	"dojo/_base/array", 
	"dojo/_base/Color", 
	"dojo/number", 
	"dojo/parser", 
	"dojo/dom", 
	"dijit/registry",
	 
	"dijit/form/Button", 
	"dijit/form/Textarea",
	 
	"dijit/layout/BorderContainer", 
	"dijit/layout/ContentPane", 
	"dijit/layout/AccordionContainer", 
	"dojo/domReady!"
	], function(Map, 
		esriConfig,
		 
		Scalebar, 
		HomeButton, 
		Geocoder, 
		LocateButton, 
		BasemapToggle, 
		Locator,
		 
		Graphic, 
		InfoTemplate, 
		SimpleMarkerSymbol, 
		SimpleLineSymbol, 
		Font, 
		TextSymbol, 
		arrayUtils, 
		Color, 
		number, 
		parser, 
		dom, 
		registry) 
		{
	parser.parse();

	//configure map animation to be faster
	esriConfig.defaults.map.panDuration = 1;
	// time in milliseconds, default panDuration: 250
	esriConfig.defaults.map.panRate = 1;
	// default panRate: 25
	esriConfig.defaults.map.zoomDuration = 100;
	// default zoomDuration: 500
	esriConfig.defaults.map.zoomRate = 1;
	// default zoomRate: 25

	//get user's screen resolution
	var height = window.screen.availHeight;
	var width = window.screen.availWidth;

	if (height != 1024 && width != 1280) {
		map = new Map("map", {
			basemap : "streets",
			center : [-97.5, 52.5],
			//center: [-97.0, 60.0], //load map on the approx. longitudinal and latitudinal centre of Canada
			zoom : 5,
			nav : 0,
			minScale : 73957192
		});
	} else {
		map = new Map("map", {
			basemap : "streets",
			center : [-108.0, 58.0],
			//center: [-97.0, 60.0], //load map on the approx. longitudinal and latitudinal centre of Canada
			zoom : 4,
			nav : 0,
			minScale : 73957192
		});
	}

	var home = new HomeButton({
		map : map
	}, "HomeButton");
	home.startup();

	geocoder = new Geocoder({
		map : map,
		autoComplete : true,
		showResults : true
		//theme: "arcgisGeocoder"
		//value: "Location Search"
	}, "search");
	geocoder.startup();

	var scalebar = new Scalebar({
		map : map,
		attachTo : "bottom-left",
		// "dual" displays both miles and kilmometers
		// "english" is the default, which displays miles
		// use "metric" for kilometers
		scalebarUnit : "dual"
	});

	geoLocate = new LocateButton({
		map : map,
		scale : 4514,
		geolocationOptions : {
			maximumAge : 0,
			timeout : 15000,
			enableHighAccuracy : true
		}
	}, "LocateButton");
	geoLocate.startup();

	var toggle = new BasemapToggle({
		map : map,
		basemap : "satellite"
	}, "BasemapToggle");
	toggle.startup();

	locator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
	locator.on("address-to-locations-complete", showResults);

	// listen for button click then geocode
	registry.byId("locate").on("click", EchoUserInput);
	registry.byId("clear").on("click", clearMap);
	registry.byId("all").on("click", EchoUserInput_all);
	registry.byId("submit").on("click", DatePickQuery);
	registry.byId("clearDate").on("click", DatePickClear);

	function DatePickQuery() {

		console.log("Date Pick Query");
		var fromDate = document.getElementById('from').value;
		var toDate = document.getElementById('to').value;

		var radiosDate = document.getElementsByName('datePick');

		for (var z = 0, length = radiosDate.length; z < length; z++) {
			if (radiosDate[z].checked) {

				switch (radiosDate[z].value) {

					case "open":
						var echoElem = "DateO-" + fromDate + "-" + toDate;
						var labelName = "<b>OPEN</b> " + fromDate.replace(/\//g, "-") + " <b>to</b> " + toDate.replace(/\//g, "-");
						break;
					case "closed":
						var echoElem = "DateC-" + fromDate + "-" + toDate;
						var labelName = "<b>CLOSED</b> " + fromDate.replace(/\//g, "-") + " <b>to</b> " + toDate.replace(/\//g, "-");
						break;
					case "mixed":
						var echoElem = "DateM-" + fromDate + "-" + toDate;
						var labelName = "<b>ALL</b> " + fromDate.replace(/\//g, "-") + " <b>to</b> " + toDate.replace(/\//g, "-");
						break;
				}
			}
		}

		window.labelName = labelName;

		console.log("parameter: " + echoElem);
		DatabaseWebService.Service1.GetAddress(echoElem, SucceededCallback);

	}

	function DatePickClear() {

		console.log("Date Pick Clear");
		var fromDate = document.getElementById('from').value = "";
		var toDate = document.getElementById('to').value = "";

		var ele = document.getElementsByName("datePick");
		for (var i = 0; i < ele.length; i++)
			ele[i].checked = false;
	}

	// This function calls the Web Service method.
	function EchoUserInput() {

		console.log("Geocode/Locate button pressed");

		var radios = document.getElementsByName('analyst');

		for (var i = 0, length = radios.length; i < length; i++) {
			if (radios[i].checked) {

				console.log("Checked radio button:" + radios[i].value);

				if (radios[i].value == "Desktop" || radios[i].value == "Server" || radios[i].value == "Development" || radios[i].value == "Solutions") {
					var labelName = radios[i].value;
				} else {
					var labelName = radios[i].id;
				}

				window.labelName = labelName;

				//Call WEB SERVICE
				var echoElem = radios[i].value;
				DatabaseWebService.Service1.GetAddress(echoElem, SucceededCallback);

				break;
			}
		}
	}

	function EchoUserInput_all() {

		console.log("Geocode/Locate EVERYTHING");

		var labelName = "All Open Cases";
		window.labelName = labelName;

		//Call WEB SERVICE
		var echoElem_all = "everything";
		DatabaseWebService.Service1.GetAddress(echoElem_all, SucceededCallback);
	}

	// This is the callback function that processes the Web Service return value
	function SucceededCallback(result) {

		window.result = result;

		console.log(result);

		preLocate();
	}

	function preLocate() {

		console.log("preLocate function");

		var postalCodes = result.split("-");

		//Number of CASES formatting
		var cases = postalCodes.length - 1;

		//Generate analyst symbol color
		var analystColor = get_random_color();
		window.analystColor = analystColor;

		console.log("LABEL NAME: " + labelName);

		if (labelName == "Desktop" || labelName == "Server" || labelName == "Development" || labelName == "Solutions") {
			var id = labelName + "Legend";
		} else {
			var id = labelName.replace(" ", "");
		}

		window.labelName = labelName;

		console.log("ID: " + id);

		//create canvas and label
		//var division = document.createElement("div");
		//division.setAttribute('id', id);
		var choiceSelection = document.createElement("canvas");
		var choiceLabel = document.createElement('label');

		//canvas attributes
		choiceSelection.setAttribute('id', id);
		choiceSelection.setAttribute('width', 30);
		choiceSelection.setAttribute('height', 15);
		choiceSelection.setAttribute('style', "padding-top:10px");

		//label attributes
		choiceLabel.innerHTML = labelName + " (" + cases + ")" + "<br/>";
		choiceLabel.setAttribute('for', id);
		choiceLabel.setAttribute('style', "padding-left:5px; padding-right:5px");
		choiceLabel.setAttribute('id', id + "label");

		//add elements to appropriate div if non-existant
		var existCheckCanvas = document.getElementById(id);

		if (existCheckCanvas == null) {
			document.getElementById("legend").appendChild(choiceSelection);
		}

		var existCheckLabel = document.getElementById(id + "label");

		if (existCheckLabel == null) {
			document.getElementById("legend").appendChild(choiceLabel);

			var CasesNumb_large = document.getElementById("hugeNumb");
			CasesNumb_large.innerHTML = calcTotal(cases);
		}

		choiceLabel = null;

		var geomArrayX = "";
		var geomArrayY = "";

		window.geomArrayX = geomArrayX;
		window.geomArrayY = geomArrayY;

		console.log("CONTEXT: " + id);

		var c = document.getElementById(id);
		var ctx = c.getContext("2d");
		ctx.fillStyle = analystColor;
		ctx.fillRect(0, 0, 30, 30);

		for (var code = 0; code < postalCodes.length - 1; code++) {

			locate(postalCodes[code]);
		}
	}


	map.infoWindow.resize(200, 125);

	function locate(singleCode) {

		var address = {
			"SingleLine" : singleCode
			//"SingleLine": dom.byId("address").value
		};

		var outSR = new esri.SpatialReference({
			wkid : 4326
		});

		locator.outSpatialReference = outSR;

		//locator.outSpatialReference = map.spatialReference;
		var options = {
			address : address,
			outFields : ["Loc_name"]
		}
		locator.addressToLocations(options);
	}

	function showResults(evt) {
		var candidate;
		var analystInfo = labelName;
		var symbol = new SimpleMarkerSymbol();
		//for no symbol outline, change hexadecimal to analystColor
		var outline = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, "#000000", 1);
		var infoTemplate = new InfoTemplate("Client Location",
		//"Address: ${address}<br />Score: ${score}<br />Source locator: ${locatorName}"
		"Case #: <br /> Address: ${address}<br />Analyst: ${analystInfo}<br />Other: ${*}");

		infoTemplate.content = "Case #: <br /> Address: ${address}<br />Analyst: ${analystInfo}<br />Other: ${*}";
		//ouline.setStyle(SimpleLineSymbol.STYLE_NULL);
		symbol.setStyle(SimpleMarkerSymbol.STYLE_CIRCLE);
		symbol.setColor(new Color(analystColor));
		symbol.setOutline(outline);
		symbol.setSize(10);

		var geom;

		arrayUtils.every(evt.addresses, function(candidate) {

			console.log("Function candidate START");

			console.log(candidate.score);
			if (candidate.score > 80) {
				console.log(candidate.location);

				//geomArrayX.push("[" + candidate.location.x + "," + candidate.location.y + "]");

				geomArrayX = geomArrayX + parseInt(candidate.location.x);
				geomArrayY += Number(candidate.location.y);

				//window.geomArrayX = geomArrayX;
				//window.geomArrayY = geomArrayY;

				//console.log("geomArrayX: " + geomArrayX + " geomArrayY: " + geomArrayY);

				var attributes = {
					address : candidate.address,
					score : candidate.score,
					locatorName : candidate.attributes.Loc_name
				};
				geom = candidate.location;

				var graphic = new Graphic(geom, symbol, attributes, infoTemplate);
				//add a graphic to the map at the geocoded location
				map.graphics.add(graphic);
				//add a text symbol to the map listing the location of the matched address.
				var displayText = candidate.address;
				var font = new Font("8pt", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_NORMAL, "Helvetica");

				var textSymbol = new TextSymbol(displayText, font, new Color("#FFFF00"));
				textSymbol.setOffset(0, 8);
				map.graphics.add(new Graphic(geom));
				return false;
				//break out of loop after one candidate with score greater than 80 is found.
			}
		});

		//zoom the map to the extent of the results
		//uses average X and Y of geocoded locations to centre map
		//map.centerAndZoom([-98.5, 54.5], 4);
	}

	function get_random_color() {
		var letters = '0123456789ABCDEF'.split('');
		var color = '#';
		for (var i = 0; i < 6; i++) {
			color += letters[Math.round(Math.random() * 15)];
		}
		return color;
	}

	function calcTotal(cases) {
		var current = document.getElementById("hugeNumb");
		console.log("INNER: " + current.innerHTML);
		var total = cases + Number(current.innerHTML);

		return total;
	}

	function clearMap() {

		map.graphics.clear();

		//Clear Text
		//var CasesNumbClear = document.getElementById("numbCases");
		//CasesNumbClear.innerHTML = "";

		var CasesNumbClear_huge = document.getElementById("hugeNumb");
		CasesNumbClear_huge.innerHTML = "";

		//Clear Legend
		var LegendClear = document.getElementById("legend");
		LegendClear.innerHTML = "";

		cases = 0;
	}

});

