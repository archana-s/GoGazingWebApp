
    
HomePage = Backbone.View.extend({
    
    el: '.main-content',
    loader_img: '<img src="images/loader.gif"/>',
    
    initialize: function() {
        this.render();
        this.cloudcover = "";
        this.visibility = "";
    },
    
    events: {
        "click .change_loc_button" : "changeLocation",
        "click .go_button" : "changeLocationGo"
    },
    
    render: function(){
        var moonphase = this.getMoonPhaseForToday();
        var upcoming_dark_nights = this.upcomingDarkNights(45);
        var gaze_condition = "Moon is too bright to gaze";
        if (moonphase === 'New Moon') {
            gaze_condition = "New moon. Great night to gaze";
        }
        $.get('templates/moonphase.html', function(templates) {  
            // Fetch the <script /> block from the loaded external 
            // template file which contains our greetings template.
            var template = $(templates).html();
            $('.moon_phase_section').children().remove();
            $('.moon_phase_section').append(Mustache.render(templates, {"gaze_condition": gaze_condition, "moon_phase": moonphase, "dark_nights_this_month":upcoming_dark_nights}));
        });
        
        $('.title_city').children().remove();
        $('.title_city').append(geoplugin_city());
        // Get weather conditions here 
        this.getWeatherConditionsWithLatLong(geoplugin_latitude(), geoplugin_longitude());
        this.readDarkSpots();
        this.putLoader();
        return this;
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
    
    getCityName: function(lat, long) {
        
    },
    
    getWeatherConditionsWithLatLong: function(lat, long) {
        var geo_specs = lat + "+" + long;
       //http://api.worldweatheronline.com/free/v1/weather.ashx?q=37.38+-122.08&format=json&num_of_days=1&date=tomorrow&key=nbqknshhbpgug2gc6jrvdv23
        var url = "http://api.worldweatheronline.com/free/v1/weather.ashx?";
        var queryString = "q=" + geo_specs + "&format=json&num_of_days=1&date=tomorrow";
        var key = "&key=nbqknshhbpgug2gc6jrvdv23";
        
        console.log (url + queryString + key);
        $.getJSON (url + queryString + key + "&callback=?").success (this.extractWeatherInfo);
    },
    
    extractWeatherInfo: function (data) {
        var self = this;
        var visibility  = data.data.current_condition[0].visibility;
        var cloud_cover = data.data.current_condition[0].cloudcover;
        console.log (visibility + " " + cloud_cover);
        
        $.get('templates/location_info.html', function(templates) {  
            // Fetch the <script /> block from the loaded external 
            // template file which contains our greetings template.
            var template = $(templates).html();
            $('.location_weather_section').children().remove();
            $('.location_weather_section').append(Mustache.render(templates, {"cloud_cover": cloud_cover, "visibility": visibility, "city":geoplugin_city()}));
        });
    },
    
    changeLocation: function(event) {
        $('.change_location').css ("display", "block");
    },
    
    changeLocationGo: function(event) {
        var self = this;
        var inputLocation = $("#location_input").val();
        $('.location_weather_data').remove();
        // only digits - asssume its a zipcode 
        if (inputLocation.match(/^\d+$/)) {
            this.getWeatherConditionsWithZip(inputLocation);
        }
        else {
            var url = "http://maps.googleapis.com/maps/api/geocode/json?address="+ inputLocation +"&sensor=false";
            $.getJSON(url).success (function(data){
                var lat = data.results[0].geometry.location.lat;
                var long = data.results[0].geometry.location.lng; 
                self.getWeatherConditionsWithLatLong(lat, long);
            });
        }  
    },
   
    getWeatherConditionsWithZip: function(zipcode) {
        this.getCityNameFromZipcode(zipcode);
       //http://api.worldweatheronline.com/free/v1/weather.ashx?q=15213&format=json&num_of_days=1&date=tomorrow&key=nbqknshhbpgug2gc6jrvdv23
        var geo_specs = zipcode;
        var url = "http://api.worldweatheronline.com/free/v1/weather.ashx?";
        var queryString = "q=" + geo_specs + "&format=json&num_of_days=1&date=today";
        var key = "&key=nbqknshhbpgug2gc6jrvdv23";
        
        console.log (url + queryString + key);
        $.getJSON (url + queryString + key + "&callback=?").success (this.extractWeatherInfo);
    },
    
    readDarkSpots: function(lat, long) {
        console.log ("Reading the dark spots json file");
        $.getJSON ('data/darkspots.json', this.getDarkSpotsForTheRegion);
    },
    
    getDarkSpotsForTheRegion:function(data) {
        var lat = geoplugin_latitude();
        var long = geoplugin_longitude ();
        
        var spots = [];
        var index = 0;
        $.each (data.spots, function(){
            if (Math.abs(this.lat - lat) <= 3 && Math.abs(this.long - long) <= 3) {
                var obj = {"name": this.name, "lat": this.lat, "long": this.long};
                spots[index++] = obj;
            }
        });
        console.log (spots);
            
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
        debugger;
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
                    console.log (cityName);
                    $(".city").empty();
                    $(".city").html (cityName);
                }
            }
        });
    }
    
});

$(document).ready (function(){
    homepage = new HomePage();
    console.log (geoplugin_latitude() + " " + geoplugin_longitude());
});


    
