var GoGazeModel = Backbone.Model.extend ({
    
    city: 'Mountain View',
    moonphase: 'New Moon',
   
    initialize: function() {
        _.bindAll(this, "getDarkSpotsForTheRegion");
        this.date = new Date();
        this.latitude = geoplugin_latitude();
        this.longitude = geoplugin_longitude();
        this.spots = [];
        this.darkNights = "";
    },
    
    populateModel: function() {
        
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
        this.moonphase =  this.getMoonPhase (todayDate.getDate(), todayDate.getMonth()+1, todayDate.getFullYear());
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
		  case 1:
			 return 'Waxing Crescent Moon';
		  case 2:
			 return 'Quarter Moon';
		  case 3:
			 return 'Waxing Gibbous Moon';
		  case 4:
			 return 'Full Moon';
		  case 5:
			 return 'Waning Gibbous Moon';
		  case 6:
			 return 'Last Quarter Moon';
		  case 7:
			 return 'Waning Crescent Moon';
		  default:
			 return 'Error';
	   }
    },
    
    readDarkSpots: function() {
        $.getJSON ('data/darkspots.json', this.getDarkSpotsForTheRegion);
    },
    
    getDarkSpotsForTheRegion:function(data) {
        this.spots = [];
        var lat = this.latitude;
        var long = this.longitude;
        var self = this;
        var index = 0;
        $.each (data.spots, function(){
            if (Math.abs(this.lat - lat) <= 3 && Math.abs(this.long - long) <= 3) {
                var obj = {"name": this.name, "lat": this.lat, "long": this.long};
                self.spots[index++] = obj;
            }
        });
        this.trigger("fetchedDarkSpots");
    },
    
     upcomingDarkNights: function(numDays) {
        this.darkNights = "";
        var index = 0;
        for( var i=0;i<numDays;i++) {
            var today = new Date();
            var vardate = new Date();
            vardate.setDate (today.getDate()+i);
            var month = vardate.getMonth() + 1;
            var moonphase = this.getMoonPhase (vardate.getDate(), month, vardate.getFullYear());
            if (moonphase === 'New Moon') {
               this.darkNights = this.darkNights + " " + vardate.getDate() + " " + this.getMonthName(month) + " " + vardate.getFullYear() + "   ";
            }
        }
        return this.darkNights;
    },
    
});