// initMap()
// function initMap() {
    
//   setTimeout(() => {
//     console.log(document.getElementById('map'))
//     // The location of boston
//     var boston = {lat: 42.3601, lng: -71.0589};
//     // The map, centered at boston
//     var map = new google.maps.Map(
//         document.getElementById('map'), {zoom: 11, center: boston});
    
//     // The marker, positioned at boston
//     // var marker = new google.maps.Marker({position: boston, map: map});
//     $("#map").css('height', '400px')

//   }, 100)
  
// }


// Enter Vuejs
// when page loads run all of this code
document.addEventListener('DOMContentLoaded', () => {

const APP = new Vue({
    el: '#app',
    // define data - initial display text
    data: {
        iconMap: {
            transportation: 'transportation.png',
            inHouseHelp: 'inHouseHelp.png',
            shopping: 'shopping.png',
        },
        lat: 0,
        lng: 0,
        google: '',//delete?
        geocoder: '',//delete?
        mgh_map: null,
        posts: [],
        markers: [],
        addPostForm: {
          name: '',
          email: '',
          address: '',
          post: '',
          requestType: '',
          helpType: false,
          status: '',
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
          status: '',
        },

    },
    created() {
      this.getRequests()
    },
    mounted() {
        // axios.get('http://localhost:5000/ping').then(response => {
        //     // console.log(response.data);
        //     // this.results = "this is from mounted()";
        //     })
        
        function initMap(callback) {
          // data() not accessible here
          setTimeout(() => {
            // The location of boston
            var boston = {lat: 42.3601, lng: -71.0589};
            // The map, centered at boston
            mgh_map = new google.maps.Map(document.getElementById('map'), {zoom: 11, center: boston});

            $("#map").css('height', '400px')
            callback(mgh_map);
          }, 1000)
        }
  
        initMap(this.updateMap)
        
    },
    methods: {
        // initMap() {
        //   setTimeout(() => {
        //     // The location of boston
        //     var boston = {lat: 42.3601, lng: -71.0589};
        //     // The map, centered at boston
        //     this.mgh_map = new google.maps.Map(
        //         document.getElementById('map'), {zoom: 11, center: boston});
            
        //     // The marker, positioned at boston
        //     // var marker = new google.maps.Marker({position: boston, map: map});
        //     $("#map").css('height', '400px')
        
        //   }, 100)
        // },
        getMap(callback) {
          let vm = this // vm must mean Vue Model...used to model vue instances.
          function checkForMap() {
            console.log('checkForMap...')
            if (vm.mgh_map) callback(vm.map_mgh)
            else setTimeout(checkForMap, 200)
          }
          checkForMap()
        },
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
        initForm() {
          this.addPostForm.name = '';
          this.addPostForm.email = '';
          this.addPostForm.address = '';
          this.addPostForm.post = '';
          this.addPostForm.requestType = '';
          this.addPostForm.helpType = false;
          this.addPostForm.status = '';
          this.editPostForm.id = '';
          this.editPostForm.name = '';
          this.editPostForm.email = '';
          this.editPostForm.address = '';
          this.editPostForm.post = '';
          this.editPostForm.requestType = '';
          this.editPostForm.helpType = false;
          this.editPostForm.status = '';
        },
        geocodeAddress(request, callback) {
          // return { lat: 5, long: 5 };
          // const street = document.getElementById('address').value;
          const street = request.address;
          this.geocoder.geocode({ address: street }, (results) => {
            // console.log(typeof(this));
            // console.log(results[0].geometry.location.lat());
            // console.log(results[0].geometry.location.lng());
            const lat_lngs = {
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng(),
            };
            // if (status === 'OK') {
            //   const [result] = results;
            //   const { lat, lng } = result.geometry.location;
            //   return { lat, lng };
            // }
            // return { lat: -1, lng: -1 };
            // alert(`Geocode was not successful for the following reason: ${status}`);
            callback(lat_lngs);
          });
        },
        removeAllMarkers() {
          this.mgh_map.data.forEach((feature) => {
            if (feature.getGeometry().getType() === 'Point') {
              this.mgh_map.data.remove(feature);
            }
          });
        },
        updateMap(mgh_map) {
          this.mgh_map = mgh_map //store map

          this.posts.forEach((post,i,array) => {
            marker = new window.google.maps.Marker({
              // position: { lat: 42.3601, lng: -71.0589 },
              position: { lat: post.lat, lng: post.lng },
              map: this.mgh_map,
              // icon: '/' + this.iconMap[post.requestType],
            });
            this.markers.push(marker)
            const contentString = `<h3>${post.name}</h3><hr><br><p>${post.post}</p>`;
            const infowindow = new window.google.maps.InfoWindow({
              content: contentString,
              maxWidth: 200,
            });
            console.log(i)
            console.log(this.markers[i])
            marker.addListener('click', () => {
              infowindow.open(this.mgh_map, this.markers[i]);
            });
          })

          // this.removeAllMarkers();
          // this.posts.forEach((post) => {
          //   // Info window content
          //   const contentString = `<h3>${post.name}</h3><hr><br><p>${post.post}</p>`;
          //   // Add info window
            // const infowindow = new google.maps.InfoWindow({
            //   content: contentString,
            //   maxWidth: 200,
            // });
          //   console.log('[1] before or after?')
          //   // Adding markers
            // var marker = null;
            // this.getMap(map => {
            //   marker = new google.maps.Marker({
            //     position: { lat: 42.3601, lng: -71.0589 },
            //     map: map,
            //     // icon: '/' + this.iconMap[post.requestType],
            //   });
            //   console.log('asdfasdf')
            //   marker.addListener('click', () => {
            //     infowindow.open(map, marker);
            //   });

            // })
          //   console.log('[2] before or after?')

          // });
        },
        onSubmit(evt) { // when you click submit of new request form
          evt.preventDefault();
          $('#addPostModal').modal('toggle')
          this.geocoder = new window.google.maps.Geocoder();
          this.geocodeAddress(this.addPostForm, (lat_lngs) => {
            const payload = {
              name: this.addPostForm.name,
              email: this.addPostForm.email,
              address: this.addPostForm.address,
              lat: lat_lngs.lat,
              lng: lat_lngs.lng,
              post: this.addPostForm.post,
              requestType: this.addPostForm.requestType,
              helpType: this.addPostForm.helpType,
              status: this.addPostForm.status,
            };
            console.log(payload)
            this.addRequest(payload);
            this.initForm();
          });
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
            status: post.status,
          }
        },
        onSubmitUpdate(evt) {
          evt.preventDefault();
          $('#editPostModal').modal('toggle')
          this.geocoder = new window.google.maps.Geocoder();
          this.geocodeAddress(this.editPostForm, (lat_lngs) => {
            const payload = {
              name: this.editPostForm.name,
              email: this.editPostForm.email,
              address: this.editPostForm.address,
              lat: lat_lngs.lat,
              lng: lat_lngs.lng,
              post: this.editPostForm.post,
              requestType: this.editPostForm.requestType,
              helpType: this.editPostForm.helpType,
              status: this.editPostForm.status,
            };
            console.log(payload)
            this.updateRequest(payload, this.editPostForm.id);
            this.initForm();
          });

          
          
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
          //     status: this.editPostForm.status,
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

