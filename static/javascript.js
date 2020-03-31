// Initialize and add the map
function updateMap() { // callback function
    $("#map").css('height', '400px')
    
  }

function initMap(callback=updateMap) {
    // The location of Uluru
    var uluru = {lat: -25.344, lng: 131.036};
    // The map, centered at Uluru
    var map = new google.maps.Map(
        document.getElementById('map'), {zoom: 4, center: uluru});
    
    // The marker, positioned at Uluru
    var marker = new google.maps.Marker({position: uluru, map: map});

    callback();
  }



// when life is settled, load up the fun stuff
document.addEventListener('DOMContentLoaded', function () {
    console.log('AAAAAAAAAAAAAAAAAAAAAAAA')
    sg1 = new Vue({
        el: '#dtBasicExample',
        // define data - initial display text
        data: {
        name: "Person",
        email: "bbearce@gmail.com",
        address: "02134",
        post: "I need toilet paper",
        requestType: "Shopping",
        needHelp: true,
        canHelp: false,
        m1: "asdfasdf",
        },
    })

    console.log(sg1)
    console.log(sg1.$data)
    console.log(sg1.$data.m1)
    sg1.$data.m1 = "different"
    console.log(sg1.$data.m1)
})

