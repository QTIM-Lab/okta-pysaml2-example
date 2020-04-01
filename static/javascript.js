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

const APP = new Vue({
    el: '#app',
    // define data - initial display text
    data: {
      //delete start
        // results: 'test',
        // temp: {
        //     name: "Person",
        //     email: "bbearce@gmail.com",
        //     address: "02134",
        //     post: "I need toilet paper",
        //     requestType: "Shopping",
        //     needHelp: true,
        //     canHelp: false,
        //     m1: "asdfasdf", 
        // },
        //delete end
        iconMap: {
            transportation: 'transportation.png',
            inHouseHelp: 'inHouseHelp.png',
            shopping: 'shopping.png',
        },
        lat: 0,
        lng: 0,
        google: '',//delete?
        geocoder: '',//delete?
        map: '',
        posts: [],
        addPostForm: {
          name: '',
          email: '',
          address: '',
          post: '',
          requestType: '',
          helpType: false,
        },
        message: false,
        // showMessage: false,
        editPostForm: {
          id: '',
          name: '',
          email: '',
          address: '',
          post: '',
          requestType: '',
          helpType: false,
        },

    },
    
    mounted() {
        axios.get('http://localhost:5000/ping').then(response => {
            // console.log(response.data);
            // this.results = "this is from mounted()";
            })
    },
    created() {
      this.getRequests();
    },
    methods: {
        ping() {
            const path = 'http://localhost:5000/ping';
            axios.get(path)
              .then((res) => {
                this.posts = res.data.posts;
                // this.updateMap();
                // this.updateMap(this.posts);
              })
              .catch((error) => {
                // eslint-disable-next-line
                console.error(error);
              });
        },
        getRequests() {
          const path = 'http://localhost:5000/posts';
          axios.get(path)
            .then((res) => {
              this.posts = res.data.posts;
              console.log(this.posts)
              // this.updateMap();
              // this.updateMap(this.posts);
            })
            .catch((error) => {
              // eslint-disable-next-line
              console.error(error);
            });
        },
        addRequest(payload) { // actually posts data to db
          const path = 'http://localhost:5000/posts';
          axios.post(path, payload)
            .then((res) => {
              this.getRequests();
              // this.message = 'Request added!';
              this.message = res.data.message
            })
            .catch((error) => {
              // eslint-disable-next-line
              console.log(error);
              this.getRequests();
            });
        },
        initForm() {
          this.addPostForm.name = '';
          this.addPostForm.email = '';
          this.addPostForm.address = '';
          this.addPostForm.request = '';
          this.addPostForm.requestType = '';
          this.addPostForm.helpType = false;
          this.editPostForm.id = '';
          this.editPostForm.name = '';
          this.editPostForm.email = '';
          this.editPostForm.address = '';
          this.editPostForm.post = '';
          this.editPostForm.requestType = '';
          this.editPostForm.helpType = false;
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
          this.posts.forEach((request) => {
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
          $('#addPostModal').modal('toggle')
          const payload = {
            name: this.addPostForm.name,
            email: this.addPostForm.email,
            address: this.addPostForm.address,
            lat: this.lat,
            lng: this.lng,
            post: this.addPostForm.post,
            requestType: this.addPostForm.requestType,
            helpType: this.addPostForm.helpType,
          };
          this.addRequest(payload);
          this.initForm();
          // this.geocodeAddress(this.addPostForm, (test) => {
          //   const payload = {
          //     name: this.addPostForm.name,
          //     email: this.addPostForm.email,
          //     address: this.addPostForm.address,
          //     lat: test.lat,
          //     long: test.long,
          //     request: this.addPostForm.request,
          //     requestType: this.addPostForm.requestType,
          //     helpType: this.addPostForm.helpType,
          //   };
          //   this.addRequest(payload);
          //   this.initForm();
          // });
        },
        onReset(evt) {
          evt.preventDefault();
          this.$refs.addRequestModal.hide();
          this.initForm();
        },
        editPost(post) {
          this.editPostForm = {
            id: post.id,
            name: post.name,
            email: post.email,
            address: post.address,
            post: post.post,
            requestType: post.requestType,
            helpType: post.helpType,
          }
        },
        onSubmitUpdate(evt) {
          evt.preventDefault();
          $('#editPostModal').modal('toggle')
          const payload = {
            name: this.editPostForm.name,
            email: this.editPostForm.email,
            address: this.editPostForm.address,
            lat: this.lat,
            lng: this.lng,
            post: this.editPostForm.post,
            requestType: this.editPostForm.requestType,
            helpType: this.editPostForm.helpType,
          };
          console.log(payload)
          console.log('this.editPostForm.id',this.editPostForm.id)
          this.updateRequest(payload, this.editPostForm.id);          
          this.initForm();
          
          
          // this.geocodeAddress(this.editPostForm, (test) => {
          //   const payload = {
          //     name: this.editPostForm.name,
          //     email: this.editPostForm.email,
          //     address: this.editPostForm.address,
          //     lat: test.lat,
          //     lng: test.lng,
          //     request: this.editPostForm.request,
          //     requestType: this.editPostForm.requestType,
          //     helpType: this.editPostForm.helpType,
          //   };
          //   this.updateRequest(payload, this.editPostForm.id);
          // });
          // const payload = {
          //   name: this.editPostForm.name,
          //   email: this.editPostForm.email,
          //   address: this.editPostForm.address,
          //   request: this.editPostForm.request,
          //   needHelp,
          //   canHelp,
          // };
          // this.updateRequest(payload, this.editPostForm.id);
        },
        updateRequest(payload, requestID) {
          const path = `http://localhost:5000/posts/${requestID}`;
          axios.put(path, payload)
            .then(() => {
              this.getRequests();
              this.message = 'Request updated!';
              // this.showMessage = true;
            })
            .catch((error) => {
              // eslint-disable-next-line
              console.error(error);
              this.getRequests();
            });
        },
        onResetUpdate(evt) {
          evt.preventDefault();
          this.$refs.editPostModal.hide();
          this.initForm();
          this.getRequests(); // why?
        },
        removeRequest(requestID) {
          const path = `http://localhost:5000/posts/${requestID}`;
          axios.delete(path)
            .then((res) => {
              this.getRequests();
              this.message = res.data.message;
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

