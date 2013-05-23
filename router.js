Router = Backbone.Router.extend({
    
    routes: {
        "": "page_init",
    },
    
    page_init: function() {
        console.log ("initializing page for display");
    },
});