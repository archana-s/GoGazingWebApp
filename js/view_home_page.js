
    
HomePage = Backbone.View.extend({
    
    el: 'body',
    loader_img: '<img src="images/loader.gif"/>',
    allowed_weather_failures: 3,
    num_weather_failures: 0,
    moon_phase_retrieved: false,
    weather_retrieved: false,
    city_info_retrieved: false,
    
    initialize: function() {
        _.bindAll (
            this, 
            "render", 
            "updateDarkSpotsForTheRegion", 
            "displayWeatherInfo", 
            "displayWeatherError",
            "updateCityEverywhere"
        );
        this.render();
        this.model.bind("fetchedDarkSpots", this.updateDarkSpotsForTheRegion);
        this.model.bind("cityUpdated", this.updateCityEverywhere);
        this.model.bind("weatherFetchSuccess", this.displayWeatherInfo);
        this.model.bind("weatherFetchFailed", this.displayWeatherError);
    },
    
    events: {
        "click .change_loc_button" : "changeLocation",
        "click .go_button" : "changeLocationGo",
        "click .cancel_button": "clearPopup",
        "click .close_button" : "clearPopup"
    },
    
    render: function(){
        var that = this;
        this.initVars();
        
        if(this.model.moonphase !== 'New Moon') {
            $(".gaze_verdict").children().remove();
            $(".gaze_verdict").append("Bright Moon. Telescope recommended");
        }
        
        var upcoming_dark_nights = this.model.upcomingDarkNights(45);
        $.get('templates/darknights.html', function(templates) {  
            var template = $(templates).html();
            $('.moon_phase_section').children().remove();
            $('.moon_phase_section').append(Mustache.render(templates, {"moon_phase": that.model.moonphase, "dark_nights_this_month":upcoming_dark_nights}));
        });
        
        $('.title_city').children().remove();
        $('.title_city').append(this.model.city);
        // Get weather conditions here 
        this.model.getWeatherConditionsWithLatLong();
        this.putLoader();
        return this;
    },
    
    initVars: function () {
        this.model.getMoonPhaseForToday();
        this.model.readDarkSpots();
    },
    
    haveAllInfo: function() {
        if (this.moon_phase_retrieved && this.city_info_retrieved && this.weather_retrieved) {
            return true;
        }
        return false;
    },
    
    updateGazeCondition: function(cloud_cover) {
        var gaze_verdict = "Bright moon. Telescope recommended";
        cloud_cover = parseInt(cloud_cover, 10);
        if (this.model.moonphase === "New Moon") {
            if (cloud_cover <= 15) {
                gaze_verdict = "Great dark night to gaze.";
            }
            else if (cloud_cover > 15 && cloud_cover < 30) {
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
    
   /* updateRetrievalInfo: function (retrieved_value) {
        switch(retrieved_value) {
                case "moon_phase":
                    this.moon_phase_retrived = true;
                    break;
                case "weather":
                    this.weather_retrieved = true;
                    break;
                case "city":
                    this.city_info_retrieved = true;
                    break;
        };
        
        if (this.haveAllInfo()) {
            this.removePageLoader();
        }
    },
                
    removePageLoader: function() {
    },
        
    addPageLoader: function() {
    },*/
    
    displayWeatherInfo: function() {
        var self = this;
        this.updateGazeCondition(this.model.cloud_cover);
        $.get('templates/location_info.html', function(templates) {  
            var template = $(templates).html();
            $('.location_weather_section').children().remove();
            $('.location_weather_section').append(Mustache.render(templates, {"cloud_cover": self.model.cloud_cover, "visibility": self.model.visibility, "moon_phase": self.model.moonphase}));
        });
    },
    
    displayWeatherError: function() {
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
            this.model.getWeatherConditionsWithLatLong();
        }
    },
    
    changeLocation: function(event) {
        $.get('templates/change_loc_popup.html', function(templates) { 
            var template = $(templates).html();
            $('.popup').children().remove();
            $('.popup').append(Mustache.render(templates, {}));
            $('.popup').css('z-index', 0);
            $('.popup').css('width', '100%');
            $('.popup').css('height', '100%');
            $('.main_body').css ('opacity', 0.2);
        });
    },
    
    clearPopup: function() {
        $('.popup').children().remove();
        $('.main_body').animate ({opacity:1.0}, 500);
        $('.popup').css('','');
    },
    
    changeLocationGo: function(event) {
        var self = this;    
        
        /** 1. Clear out gaze verdict
            */
        this.clearOutGazingCondition();
        
        /** 2. Update weather conditions
            */
        var inputLocation = $("#location_input").val();
        this.clearPopup();
        $('.location_weather_data').remove();
            
        // only digits - asssume its a zipcode 
        if (inputLocation.match(/^\d+$/)) {
            this.model.getCityNameFromZipcode(inputLocation);
        }
        else {
            self.model.city = inputLocation;
            self.updateCityEverywhere();
        }
        
        var url = "http://maps.googleapis.com/maps/api/geocode/json?address="+ inputLocation +"&sensor=false";
        $.getJSON(url).success (function(data){
            self.model.latitude = data.results[0].geometry.location.lat;
            self.model.longitude = data.results[0].geometry.location.lng;
            self.model.getWeatherConditionsWithLatLong();
            /** 3. Update Dark spots 
                */
            self.model.readDarkSpots();
        });
    },
    
    clearOutGazingCondition: function() {
        if(this.model.moonphase === 'New Moon') {
            $('.gaze_verdict').children().remove();
            $('.gaze_verdict').html(this.loader_img);
        }
    },
    
    updateDarkSpotsForTheRegion:function() {
        var self = this;
        $.get('templates/gaze_spots.html', function(templates) {  
            var template = $(templates).html();
            $('.dark_spots').children().remove();
            $('.dark_spots').append(Mustache.render(templates, {"spots": self.model.spots}));
        });
    },
    
    updateCityEverywhere: function () {
        $(".title_city").empty();
        $(".title_city").html(this.model.city).fadeIn("slow");
    }
});

$(document).ready (function(){
    var gogazingModel = new GoGazeModel();
    homepage = new HomePage({model: gogazingModel});
    //console.log (geoplugin_latitude() + " " + geoplugin_longitude());
});


    
