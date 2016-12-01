var map;
var markers = [];
var prevMarker = null;
var infoWindow;

// add location
var gLocations = [
  {title: 'Caneel Bay', location: {lat:18.3425, lng:-64.7890}},
  {title: 'Hawknest Bay', location: {lat:18.3465, lng:-64.7790}},
  {title: 'Trunk Bay', location: {lat:18.3525, lng:-64.7699}},
  {title: 'Cinnamon Bay', location: {lat:18.3535, lng:-64.7589}},
  {title: 'Francis Bay', location: {lat:18.3622, lng:-64.7459}},
  {title: 'Leinster Bay', location: {lat:18.3632, lng:-64.7220}},
  {title: 'Great Lameshur Bay', location: {lat:18.3160, lng:-64.7230}},
  {title: 'Cruz Bay', location: {lat:18.3310, lng:-64.7980}}
];

//__________________________________________ onErrorGoogleAPI _____________________________________

function onErrorGoogleAPI(){
  alert('Error: Not able to load Google MAP API script!');
}

//__________________________________________ initMap ______________________________________________

function initMap() {
  // create map
  map = new google.maps.Map(document.getElementById('map'),{
   center:{lat:18.3400, lng:-64.7400},
   zoom:13,
   mapTypeId: google.maps.MapTypeId.TERRAIN
  });

  // add info window
  infoWindow = new google.maps.InfoWindow({
    content:'Title Placeholder'
  });

  // add markers
  var image = 'images/anchor_32x32.png';

  var ulAnchorage = document.getElementById('anchorageList');

  for (var i = 0; i < gLocations.length; i++) {
    var position = gLocations[i].location;
    var title = gLocations[i].title;

    var marker = new google.maps.Marker({
      position:position,
      map:map,
      animation: google.maps.Animation.DROP,
      icon:image,
      title:title
    });

    markers.push(marker);
    gLocations[i].marker = marker;

    // add link between marker and info window
    marker.addListener('click', function(){
      populateInfoWindow(this, infoWindow);
      toggleMarker(this);
    });
  }

  // add listener to menu button
  $('#buttonShowMenu').click(function(){
    $("#wrapper").toggleClass("toggled");
    $("#menuButton").toggleClass("toggled");
  });
}

//__________________________________________ toggleMarker _________________________________________

function toggleMarker(marker){
  if(prevMarker != null)
    prevMarker.setAnimation(null);

  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(function(){
    marker.setAnimation(null);
  }, 750); // should bounve once
  prevMarker = marker;
}

//__________________________________________ onLabel ______________________________________________

function onLabel(e){
  // search in markers
  for(var i = 0; i < markers.length; i++){
    var marker = markers[i];
    if(marker.title == e.data.name){
      toggleMarker(marker);
    }
  }
}

//__________________________________________ populateInfoWindow ___________________________________

// flickr key: 28509bf1133dda4d52f3dd7502edfba3
//       secret:14dc2fd59cef04fb

function populateInfoWindow(marker, infoWnd){
  if (infoWnd.marker != marker) {
    infoWnd.marker = marker;

    // stop animation
    if(prevMarker != null)
      prevMarker.setAnimation(null);

    // set placeholder
    infoWnd.setContent('<div>' + marker.title + '</div>');
    infoWnd.open(map, marker);

    // do ajax calls to Flickr
    var flickrRequest = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=28509bf1133dda4d52f3dd7502edfba3&tags=' +
     marker.title + '&lat=' + marker.position.lat() + '&lon=' + marker.position.lng() + '&format=json&nojsoncallback=1';
    $.getJSON(flickrRequest, function(result){
      if(result.stat == 'ok'){
        // get an image
        flickrRequest = 'https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=28509bf1133dda4d52f3dd7502edfba3&photo_id=' + result.photos.photo[0].id + '&format=json&nojsoncallback=1';
        $.getJSON(flickrRequest, function(result){
           if(result.stat == 'ok'){

             var url = null;
             // get proper size
             for(var i = 0; i < result.sizes.size.length; i++){
               if(parseInt(result.sizes.size[i].width) > 320){
                 url = result.sizes.size[i].source;
                 break; // come out from loop
               }
             }

             if(url != null){ // we have good image
               // replace content with actual image
               infoWnd.setContent('<div>' + marker.title + '</div>' + '<div><img width = 320 src="'+ url +'"></div>');
             }
           }
           else
             alert(result.stat);
       })
       .fail(function(){ alert('Not able to connect to Flickr Server')});
      }
      else {
        alert(result.stat);
      }
    })
    .fail(function(){ alert('Not able to connect to Flickr Server')});

    // Make sure the marker property is cleared if the infowindow is closed.
    infoWnd.addListener('closeclick',function(){
      infoWnd.setMarker(null);
    });
  }
}

// Let's do Knockout portion
function ListViewModel(){
  var self = this;

  self.filter = ko.observable('');

  self.isVisible = function(that){
    if (self.filter()) {
      var lowCaseFilter = self.filter().toLowerCase();
      var lowCaseTitle = that.title.toLowerCase();
      if(lowCaseTitle.indexOf(lowCaseFilter) >= 0){
        that.marker.setVisible(true);
        return true;
      }

      that.marker.setVisible(false);
      return false;
    }
    else{
      if (that.marker)
        that.marker.setVisible(true);
      return true;
    }
  };

  self.clickOnLabel = function(location){
    toggleMarker(location.marker);
    google.maps.event.trigger(location.marker,'click'); // *******  add Google Maps trigger method ******
  };

  self.toggleMarker = function(marker){
    if(prevMarker != null)
      prevMarker.setAnimation(null);

    marker.setAnimation(google.maps.Animation.BOUNCE);
    prevMarker = marker;
  };

  self.location = ko.observableArray(gLocations);
}

ko.applyBindings(new ListViewModel());
