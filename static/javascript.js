// Enter Vuejs
// when page loads run all of this code
document.addEventListener('DOMContentLoaded', () => {

const APP = new Vue({
    el: '#app',
    // define data - initial display text
    data: {
        host: 'community-help.mgh.harvard.edu', //'localhost'
        iconMap: {
            transportation: 'img/transportation.png',
            inHouseHelp: 'img/inHouseHelp.png',
            shopping: 'img/shopping.png',
            petCare: 'img/petCare.png',
            canHelp: 'img/canHelp.png',
        },
        username: '',
        lat: 0, // double check we need these...might already be in posts
        lng: 0, // double check we need these...might already be in posts
        mgh_map: null,
        posts: [],
        currentSort: 'date', // for table
        currentSortDir: 'desc', // for table
        pageSize: 10, // for table
        currentPage: 1, // for table
        searchQuery: null, // for table
        markers: [],
        icons: [],
        message: {
            message_success: "",
            message_danger: "",
            message_warning: "",
        },
        addPostForm: {
          name: '',
          email: '',
          address: '',
          post: '',
          requestType: '',
          helpType: false,
          status: '',
        },
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
  
        initMap(this.updateMap); 
    },
    computed: {
      sortedPosts:function() {
        return this.posts.filter((post, index) => {
          if (this.searchQuery) {
            return this.searchQuery.toLowerCase().split(' ').every(v => post.post.toLowerCase().includes(v))
          } else {
            return true
          }
        }).sort((a,b) => {
          let modifier = 1;
          if(this.currentSortDir === 'desc') modifier = -1;
          if (this.currentSort === 'date') {
            if(Date.parse(a[this.currentSort]) < Date.parse(b[this.currentSort])) return -1 * modifier;
            if(Date.parse(a[this.currentSort]) > Date.parse(b[this.currentSort])) return 1 * modifier;            
          } 
          if(a[this.currentSort] < b[this.currentSort]) return -1 * modifier;
          if(a[this.currentSort] > b[this.currentSort]) return 1 * modifier;
          return 0;
        }).filter((row, index) => {
          let start = (this.currentPage-1)*this.pageSize;
          let end = this.currentPage*this.pageSize;
          if(index >= start && index < end) return true;
        });
      }
    },
    methods: {
        nextPage:function() {
          if((this.currentPage*this.pageSize) < this.posts.length) this.currentPage++;
        },
        prevPage:function() {
          if(this.currentPage > 1) this.currentPage--;
        },
        sort(s) {
          //if s == current sort, reverse
          if(s === this.currentSort) {
            this.currentSortDir = this.currentSortDir==='asc'?'desc':'asc';
          }
          this.currentSort = s;
        },
        ping() {
            const path = `https://${this.host}/ping`;
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
        getRequests() {
          const path = `https://${this.host}/posts`;
          axios.get(path)
            .then((res) => {
              this.posts = res.data.posts;
              this.username = res.data.username;
              // console.log(this.username) //shows old posts still...I think we should user this.markers to to loop through the markers and remove off the map...new methode removeMarkers()
              // setTimeout((() => {console.log(this.markers);this.updateMap(this.mg_map)}), 3000);
            })
            .catch((error) => {
              // eslint-disable-next-line
              // console.error(error);
            });
        },
        addRequest(payload) { // actually posts data to db
          const path = `https://${this.host}/posts`;
          axios.post(path, payload)
            .then((res) => {
              this.getRequests();
              this.updateMessage(res.data.message, alert_type='success')
            })
            .catch((error) => {              // eslint-disable-next-line
              console.log(error);
              this.getRequests();
            });
        },
        updateRequest(payload, requestID) {
          const path = `https://${this.host}/posts/${requestID}`;
          axios.put(path, payload)
            .then(() => {
              this.getRequests();
              this.updateMessage('Request updated!', alert_type='success')
            }).catch((error) => {              // eslint-disable-next-line
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
        updateMessage(message, alert_type) {
          this.message['message_success'] = "",
          this.message['message_danger'] = "",
          this.message['message_warning'] = "",

          this.message['message_'+alert_type] = message
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
        removeAllMarkers() { //Fix this
          this.mgh_map.data.forEach((feature) => {
            if (feature.getGeometry().getType() === 'Point') {
              this.mgh_map.data.remove(feature);
            }
          });
        },
        updateMap(mgh_map) {
          this.mgh_map = mgh_map //store map
          this.posts.forEach((post,i,array) => {
            if (post.helpType === 'canHelp') {
              this.icons.push('../static/' + this.iconMap[post.helpType])
            } else {
              this.icons.push('../static/' + this.iconMap[post.requestType])
            }
            
            marker = new window.google.maps.Marker({
              // position: { lat: 42.3601, lng: -71.0589 },
              position: { lat: post.lat, lng: post.lng },
              map: this.mgh_map,
              icon: this.icons[i],
            });
            this.markers.push(marker)
            const contentString = `<h3>${post.name}</h3><hr><br><p>${post.post}</p>`;
            const infowindow = new window.google.maps.InfoWindow({
              content: contentString,
              maxWidth: 200,
            });
            // console.log(i)
            // console.log(this.markers[i])
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
          // console.log(this.addPostForm)
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
              status: 'un-resolved',// this.addPostForm.status, // if we want to control status in the future
            };
            // console.log(payload)
            this.addRequest(payload);
            this.initForm();
          });
        },
        onReset(evt) { // I don't think it's being used right now
          evt.preventDefault();
          this.$refs.addRequestModal.hide();
          this.initForm();
        },
        editPost(post) {
          if (post.partnersID === this.username) {
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
          } else {
            $('#editPostModal').modal('toggle')
            this.updateMessage("This is not your post. Please don't edit others posts.", alert_type='warning')
          }
        },
        onSubmitUpdate(evt) {
          $('#editPostModal').modal('toggle')
          evt.preventDefault();
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
            // console.log(payload)
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
          const path = `https://${this.host}/posts/${requestID}`;
          axios.delete(path)
            .then((res) => {
              this.getRequests();
              this.updateMessage(res.data.message, alert_type='success')
              this.showMessage = true;// do we need this? Delete after a wekk or so
            }).catch((error) => {
              // eslint-disable-next-line
              console.error(error);
              this.getRequests();
            });
        },
        onDeleteRequest(post) {
          if (post.email === this.username) {
            this.removeRequest(post.id);
          } else {
            this.updateMessage("This is not your post. Please don't edit others posts.", alert_type='danger')
          }
        },    },



   






})












// End of "DOMContentLoaded" eventListener




})

