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


// Enter Vuejs
// when page loads run all of this code
document.addEventListener('DOMContentLoaded', () => {

const app = new Vue({
    el: '#app',
    // define data - initial display text
    data: {
        results: 'test',
        temp: {
            name: "Person",
            email: "bbearce@gmail.com",
            address: "02134",
            post: "I need toilet paper",
            requestType: "Shopping",
            needHelp: true,
            canHelp: false,
            m1: "asdfasdf", 
        },
        iconMap: {
            transportation: 'transportation.png',
            inHouseHelp: 'inHouseHelp.png',
            shopping: 'shopping.png',
        },
        lat: '',
        lng: '',
        google: '',
        geocoder: '',
        map: '',
        requests: [],
        addRequestForm: {
        name: '',
        email: '',
        address: '',
        request: '',
        requestType: '',
        needHelp: false,
        canHelp: false,
        },
        message: '',
        showMessage: false,
        editForm: {
        id: '',
        name: '',
        email: '',
        address: '',
        request: '',
        requestType: '',
        needHelp: false,
        canHelp: false,
        },

    },
    
    mounted() {
        axios.get('http://localhost:5000/ping').then(response => {
            console.log(response.data);
            this.results = response.data;
            })
    },

    methods: {
        ping() {
            const path = 'http://localhost:5000/ping';
            axios.get(path)
              .then((res) => {
                this.requests = res.data.requests;
                this.updateMap();
                // this.updateMap(this.requests);
              })
              .catch((error) => {
                // eslint-disable-next-line
                console.error(error);
              });
        },
        getRequests() {
          const path = 'http://172.21.14.152:5000/requests';
          axios.get(path)
            .then((res) => {
              this.requests = res.data.requests;
              this.updateMap();
              // this.updateMap(this.requests);
            })
            .catch((error) => {
              // eslint-disable-next-line
              console.error(error);
            });
        },
        addRequest(payload) { // actually posts data to db
          const path = 'http://172.21.14.152:5000/requests';
          axios.post(path, payload)
            .then(() => {
              this.getRequests();
              this.message = 'Request added!';
              this.showMessage = true;
            })
            .catch((error) => {
              // eslint-disable-next-line
              console.log(error);
              this.getRequests();
            });
        },
        initForm() {
          this.addRequestForm.name = '';
          this.addRequestForm.email = '';
          this.addRequestForm.address = '';
          this.addRequestForm.request = '';
          this.addRequestForm.requestType = '';
          this.addRequestForm.needHelp = false;
          this.addRequestForm.canHelp = false;
          this.editForm.id = '';
          this.editForm.name = '';
          this.editForm.email = '';
          this.editForm.address = '';
          this.editForm.request = '';
          this.editForm.requestType = '';
          this.editForm.needHelp = false;
          this.editForm.canHelp = false;
        },
        geocodeAddress(request, fn) {
          // return { lat: 5, long: 5 };
          // const street = document.getElementById('address').value;
          const street = request.address;
          this.geocoder.geocode({ address: street }, (results) => {
            // console.log(typeof(this));
            // console.log(results[0].geometry.location.lat());
            // console.log(results[0].geometry.location.lng());
            const test = {
              lat: results[0].geometry.location.lat(),
              long: results[0].geometry.location.lng(),
            };
            // if (status === 'OK') {
            //   const [result] = results;
            //   const { lat, lng } = result.geometry.location;
            //   return { lat, lng };
            // }
            // return { lat: -1, lng: -1 };
            // alert(`Geocode was not successful for the following reason: ${status}`);
            fn(test);
          });
        },
        removeAllMarkers() {
          this.map.data.forEach((feature) => {
            if (feature.getGeometry().getType() === 'Point') {
              this.map.data.remove(feature);
            }
          });
        },
        updateeMap() { // MISPELLED for a test
          this.removeAllMarkers();
          this.requests.forEach((request) => {
            // this.geocodeAddress(request);
            // this.map.setCenter({ lat: 42.3601, lng: -71.0589 });
            // this.map.setZoom(12);
            // Info window content
            const contentString = `<h3>${request.name}</h3><hr><br><p>${request.request}</p>`;
            // Add info window
            const infowindow = new this.google.maps.InfoWindow({
              content: contentString,
              maxWidth: 200,
            });
            // Adding markers
            const marker = new this.google.maps.Marker({
              map: this.map,
              position: { lat: request.lat, lng: request.long },
              icon: '/' + this.iconMap[request.requestType],
            });
            marker.addListener('click', () => {
              infowindow.open(this.map, marker);
            });
          });
        },
        onSubmit(evt) { // when you click submit of new request form
          evt.preventDefault();
          this.$refs.addRequestModal.hide();
          this.geocodeAddress(this.addRequestForm, (test) => {
            const payload = {
              name: this.addRequestForm.name,
              email: this.addRequestForm.email,
              address: this.addRequestForm.address,
              lat: test.lat,
              long: test.long,
              request: this.addRequestForm.request,
              requestType: this.addRequestForm.requestType,
              needHelp: this.addRequestForm.needHelp,
              canHelp: this.addRequestForm.canHelp,
            };
            this.addRequest(payload);
            this.initForm();
          });
        },
        onReset(evt) {
          evt.preventDefault();
          this.$refs.addRequestModal.hide();
          this.initForm();
        },
        editRequest(request) {
          this.editForm = request;
        },
        onSubmitUpdate(evt) {
          evt.preventDefault();
          this.$refs.editRequestModal.hide();
          this.geocodeAddress(this.editForm, (test) => {
            const payload = {
              name: this.editForm.name,
              email: this.editForm.email,
              address: this.editForm.address,
              lat: test.lat,
              long: test.long,
              request: this.editForm.request,
              requestType: this.editForm.requestType,
              needHelp: this.editForm.needHelp,
              canHelp: this.editForm.canHelp,
            };
            this.updateRequest(payload, this.editForm.id);
          });
          // const payload = {
          //   name: this.editForm.name,
          //   email: this.editForm.email,
          //   address: this.editForm.address,
          //   request: this.editForm.request,
          //   needHelp,
          //   canHelp,
          // };
          // this.updateRequest(payload, this.editForm.id);
        },
        updateRequest(payload, requestID) {
          const path = `http://172.21.14.152:5000/requests/${requestID}`;
          axios.put(path, payload)
            .then(() => {
              this.getRequests();
              this.message = 'Request updated!';
              this.showMessage = true;
            })
            .catch((error) => {
              // eslint-disable-next-line
              console.error(error);
              this.getRequests();
            });
        },
        onResetUpdate(evt) {
          evt.preventDefault();
          this.$refs.editRequestModal.hide();
          this.initForm();
          this.getRequests(); // why?
        },
        removeRequest(requestID) {
          const path = `http://172.21.14.152:5000/requests/${requestID}`;
          axios.delete(path)
            .then(() => {
              this.getRequests();
              this.message = 'Request removed!';
              this.showMessage = true;
            })
            .catch((error) => {
              // eslint-disable-next-line
              console.error(error);
              this.getRequests();
            });
        },
        onDeleteRequest(request) {
          this.removeRequest(request.id);
        },
    },



   






})












// End of "DOMContentLoaded" eventListener




})

