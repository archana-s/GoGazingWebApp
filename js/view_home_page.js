
    
HomePage = Backbone.View.extend({
    
    el: '.main-content',
    loader_img: '<img src="images/loader.gif"/>',
    current_chosen_city: 'Mountain View',
    current_moonphase: 'New Moon',
    allowed_weather_failures: 3,
    num_weather_failures: 0,
    current_latitude: 0,
    current_longitude: 0,
    
    initialize: function() {
        _.bindAll (
            this, "render", "extractWeatherInfo", "getDarkSpotsForTheRegion");
        this.render();
        this.cloudcover = "";
        this.visibility = "";
    },
    
    events: {
        "click .change_loc_button" : "changeLocation",
        "click .go_button" : "changeLocationGo"
    },
    
    render: function(){
        var that = this;
        this.initVars();
        
        if(this.current_moonphase !== 'New Moon') {
            $(".gaze_verdict").children().remove();
            $(".gaze_verdict").append("Bright Moon. Telescope recommended");
        }
        
        var upcoming_dark_nights = this.upcomingDarkNights(45);
        $.get('templates/moonphase.html', function(templates) {  
            // Fetch the <script /> block from the loaded external 
            // template file which contains our greetings template.
            var template = $(templates).html();
            $('.moon_phase_section').children().remove();
            $('.moon_phase_section').append(Mustache.render(templates, {"moon_phase": that.current_moonphase, "dark_nights_this_month":upcoming_dark_nights}));
        });
        
        $('.title_city').children().remove();
        $('.title_city').append(this.current_chosen_city);
        // Get weather conditions here 
        this.getWeatherConditionsWithLatLong(geoplugin_latitude(), geoplugin_longitude());
        this.readDarkSpots();
        this.putLoader();
        return this;
    },
    
    initVars: function () {
        this.current_chosen_city = geoplugin_city();
        this.current_moonphase = this.getMoonPhaseForToday();
        this.current_latitude = geoplugin_latitude();
        this.current_longitude = geoplugin_longitude();
    },
    
    updateGazeCondition: function(cloud_cover) {
        var gaze_verdict = "Bright moon. Telescope recommended";
        console.log ("Updating gaze condition: " + cloud_cover);
        cloud_cover = parseInt(cloud_cover);
        
        if (this.current_moonphase === "New Moon") {
            if (cloud_cover > 15 && cloud_cover < 30) {
                gaze_verdict = "Great dark night but a little cloudy.";
            }
            else if (cloud_cover > 30 && cloud_cover < 50) {
                gaze_verdict = "A little too cloudy for good gazing";
            }
            else {
                gaze_verdict = "Very cloudy. Not a good day to gaze";
            }
        }
        $(".gaze_verdict").children().remove();
        $(".gaze_verdict").html(gaze_verdict);
    },
    
    putLoader: function() {
        $(".moon_phase_section").children().remove();
        $(".moon_phase_section").append(this.loader_img);
        
        $(".location_weather_section").children().remove();
        $(".location_weather_section").append(this.loader_img);
        
        $(".dark_spots").children().remove();
        $(".dark_spots").append(this.loader_img);
    },
    
    getMonthName: function (number) {
        switch(number){
                case 1: return 'Jan';
                case 2: return 'Feb';
                case 3: return 'Mar';
                case 4: return 'Apr';
                case 5: return 'May';
                case 6: return 'Jun';
                case 7: return 'Jul';
                case 8: return 'Aug';
                case 9: return 'Sep';
                case 10: return 'Oct';
                case 11: return 'Nov';
                case 12: return 'Dec';
                default: return 'error';
        }
    },
    
    getMoonPhaseForToday: function() {
        var todayDate = new Date();
        return (this.getMoonPhase (todayDate.getDate(), todayDate.getMonth()+1, todayDate.getFullYear()));
    },
    
    upcomingDarkNights: function(numDays) {
        var results = "";
        var index = 0;
        for( var i=0;i<numDays;i++) {
            var today = new Date();
            var vardate = new Date();
            vardate.setDate (today.getDate()+i);
            var month = vardate.getMonth() + 1;
            var moonphase = this.getMoonPhase (vardate.getDate(), month, vardate.getFullYear());
            if (moonphase === 'New Moon') {
               results = results + " " + vardate.getDate() + " " + this.getMonthName(month) + " " + vardate.getFullYear() + "   ";
            }
        }
        return results;
    },
    
    getMoonPhase: function (day, month, year) {    
        /*
	       modified from http://www.voidware.com/moon_phase.htm
	   */
	   var c,e,jd,b = 0;
	   if (month < 3)
	   {
		  year = year - 1;
		  month = month + 12;
	   }

	   month = month + 1;
	   c = 365.25 * year;
	   e = 30.6 * month;
	   jd = c + e + day - 694039.09;	//jd is total days elapsed
	   jd = jd/29.5305882;					//divide by the moon cycle
	   b = Math.floor(jd);						//int(jd) -> b, take integer part of jd
	   jd -= b;							//subtract integer part to leave fractional part of original jd
	   b = Math.round(jd * 8);				//scale fraction from 0-8 and round

	   if (b >= 8 )
	   {  
           b = 0;//0 and 8 are the same so turn 8 into 0
	   }

	   switch (b)
	   {
		  case 0:
			 return 'New Moon';
			 break;
		  case 1:
			 return 'Waxing Crescent Moon';
             break;
		  case 2:
			 return 'Quarter Moon';
			 break;
		  case 3:
			 return 'Waxing Gibbous Moon';
			 break;
		  case 4:
			 return 'Full Moon';
			 break;
		  case 5:
			 return 'Waning Gibbous Moon';
			 break;
		  case 6:
			 return 'Last Quarter Moon';
			 break;
		  case 7:
			 return 'Waning Crescent Moon';
			 break;
		  default:
			 return 'Error';
	   }
    },
    
    getWeatherConditionsWithLatLong: function(lat, long) {
        var geo_specs = lat + "+" + long;
        this.callWeatherAPI(geo_specs); 
    },
    
    callWeatherAPI: function (geo_specs) {
        //http://api.worldweatheronline.com/free/v1/weather.ashx?q=15213&format=json&num_of_days=1&date=tomorrow&key=nbqknshhbpgug2gc6jrvdv23
        console.log ("Going to call Weather API");
        var url = "http://api.worldweatheronline.com/free/v1/weather.ashx?";
        var queryString = "q=" + geo_specs + "&format=json&num_of_days=1&date=today";
        var key = "&key=nbqknshhbpgug2gc6jrvdv23";
        
        $.getJSON (url + queryString + key + "&callback=?").success(this.extractWeatherInfo).error(this.weatherFetchFailed);
    },
    
    weatherFetchFailed: function (data) {
        this.num_weather_failures ++;
        if (this.num_weather_failures > this.allowed_weather_failures) {
            this.num_weather_failures = 0;
            $('.location_weather_section').children().remove();
            $('.location_weather_section').append ("Sorry. I am unable to fetch weather. I am notified of the problem and working on it probably right now to get it fixed for you.");
        }
        else {
            if(this.num_weather_failures === 1) {
                $('.location_weather_section').append("Oops! I am having troubles fetching weather. Trying again!");
            }
            this.getWeatherConditionsWithLatLong(this.current_latitude, this.current_longitude);
        }
    },
    
    extractWeatherInfo: function (data) {
        var self = this;
        var visibility  = data.data.current_condition[0].visibility;
        var cloud_cover = data.data.current_condition[0].cloudcover;
        this.updateGazeCondition(cloud_cover);
        console.log (visibility + " " + cloud_cover);
        
        $.get('templates/location_info.html', function(templates) {  
            // Fetch the <script /> block from the loaded external 
            // template file which contains our greetings template.
            var template = $(templates).html();
            $('.location_weather_section').children().remove();
            $('.location_weather_section').append(Mustache.render(templates, {"cloud_cover": cloud_cover, "visibility": visibility, "city": self.current_chosen_city}));
        });
    },
    
    changeLocation: function(event) {
        $('.change_location').css ("display", "block");
    },
    
    changeLocationGo: function(event) {
        var self = this;    
        
        /** 1. Clear out gaze verdict
            */
        this.clearOutGazingCondition();
        
        /** 2. Update weather conditions
            */
        var inputLocation = $("#location_input").val();
        $('.location_weather_data').remove();
            
        // only digits - asssume its a zipcode 
        if (inputLocation.match(/^\d+$/)) {
            this.getCityNameFromZipcode(inputLocation);
        }
        else {
            self.current_chosen_city = inputLocation;
            self.updateCityEverywhere();
        }
        
        var url = "http://maps.googleapis.com/maps/api/geocode/json?address="+ inputLocation +"&sensor=false";
        $.getJSON(url).success (function(data){
            self.current_latitude = data.results[0].geometry.location.lat;
            self.current_longitude = data.results[0].geometry.location.lng;
            self.getWeatherConditionsWithLatLong(self.current_latitude, self.current_longitude);
            /** 3. Update Dark spots 
                */
            self.readDarkSpots (self.current_latitude, self.current_longitude);
        });
    },
    
    clearOutGazingCondition: function() {
        if(this.current_moonphase === 'New Moon') {
            $('.gaze_verdict').children().remove();
            $('.gaze_verdict').html(this.loader_img);
        }
    },
   
    readDarkSpots: function(lat, long) {
        $.getJSON ('data/darkspots.json', this.getDarkSpotsForTheRegion);
    },
    
    getDarkSpotsForTheRegion:function(data) {
        debugger;
        var lat = this.current_latitude;
        var long = this.current_longitude;
        
        var spots = [];
        var index = 0;
        $.each (data.spots, function(){
            if (Math.abs(this.lat - lat) <= 3 && Math.abs(this.long - long) <= 3) {
                var obj = {"name": this.name, "lat": this.lat, "long": this.long};
                spots[index++] = obj;
            }
        });
       
        //render content in HTML
        $.get('templates/gaze_spots.html', function(templates) {  
            // Fetch the <script /> block from the loaded external 
            // template file which contains our greetings template.
            var template = $(templates).html();
            $('.dark_spots').children().remove();
            $('.dark_spots').append(Mustache.render(templates, {"spots": spots}));
        });
    },
    
    getCityNameFromZipcode: function(zipCode) {
        var that = this;
        var country = 'United States';               
        var geocoder = new google.maps.Geocoder();

        geocoder.geocode({ 'address': zipCode + ',' + country }, function (result, status) {
            var stateName = '';
            var cityName = '';
            var addressComponent = result[0]['address_components'];

            // find state data
            var stateQueryable = $.grep(addressComponent, function (x) {
                return $.inArray('administrative_area_level_1', x.types) != -1;
            });

            if (stateQueryable.length) {
                stateName = stateQueryable[0]['long_name'];

                var cityQueryable = $.grep(addressComponent, function (x) {
                    return $.inArray('locality', x.types) != -1;
                });

                // find city data
                if (cityQueryable.length) {
                    cityName = cityQueryable[0]['long_name'];
                    //console.log (cityName);
                    that.current_chosen_city = cityName;
                    that.updateCityEverywhere();
                }
            }
        });
    },
    
    updateCityEverywhere: function () {
        $(".title_city").empty();
        $(".title_city").html(this.current_chosen_city).fadeIn("slow");
    }
});

$(document).ready (function(){
    homepage = new HomePage();
    //console.log (geoplugin_latitude() + " " + geoplugin_longitude());
});


    
