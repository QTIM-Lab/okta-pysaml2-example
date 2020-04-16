// Switch the class of map div for mobile

function resize_map_container() {
  if($('body').width() < 300){
    $('#table').css('font-size','50%')
  } else if($('body').width() < 450){
    $('#table').css('font-size','75%')
  }else if($('body').width() > 450){
    $('#table').css('font-size','100%')
  }
}

window.addEventListener('resize', resize_map_container);

if($('body').width() < 450){
  resize_map_container(type='smaller')
}else if($('body').width() > 450 && $('body').width() < 768){
  resize_map_container(type='larger')
}

// Enter Vuejs
// when page loads run all of this code
document.addEventListener('DOMContentLoaded', () => {

const APP = new Vue({
    el: '#app',
    // define data - initial display text
    data: {
        host: 'localhost',//'community-help.mgh.harvard.edu',
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
        reviews: [
          {date: '01-01-2020',
           name: 'Ben',
           review: 'Cloud has been super helpful this quaratine'
          }
        ],
        postTable: {
          currentSort: 'date', // for post table
          currentSortDir: 'desc', // for post table
          pageSize: 10, // for post table
          currentPage: 1, // for post table
          searchQuery: null, // for post table
        },
        reviewTable: {
          currentSort: 'date', // for review table
          currentSortDir: 'desc', // for review table
          pageSize: 5, // for review table
          currentPage: 1, // for review table
          searchQuery: null, // for review table
        },
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
        addReviewForm: {
          review: '',
        },

    },
    created() {
      this.getRequests();
      this.getReviews();
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
        console.log('posts')
        return this.posts.filter((post, index) => { // first we bake in the search
          if (this.postTable.searchQuery) {
            return this.postTable.searchQuery.toLowerCase().split(' ').every(v => post.post.toLowerCase().includes(v))
          } else {
            return true
          }
        }).sort((a,b) => { //now the sort
          let modifier = 1;
          if(this.postTable.currentSortDir === 'desc') modifier = -1;
          if (this.postTable.currentSort === 'date') {
            if(Date.parse(a[this.postTable.currentSort]) < Date.parse(b[this.postTable.currentSort])) return -1 * modifier;
            if(Date.parse(a[this.postTable.currentSort]) > Date.parse(b[this.postTable.currentSort])) return 1 * modifier;            
          } 
          if(a[this.postTable.currentSort] < b[this.postTable.currentSort]) return -1 * modifier;
          if(a[this.postTable.currentSort] > b[this.postTable.currentSort]) return 1 * modifier;
          return 0;
        }).filter((row, index) => {
          let start = (this.postTable.currentPage-1)*this.postTable.pageSize;
          let end = this.postTable.currentPage*this.postTable.pageSize;
          if(index >= start && index < end) return true;
        });
      },
      sortedReviews:function() {
        console.log('reviews')
        return this.reviews.filter((review, index) => { // first we bake in the search
          if (this.reviewTable.searchQuery) {
            return this.reviewTable.searchQuery.toLowerCase().split(' ').every(v => review.review.toLowerCase().includes(v))
          } else {
            return true
          }
        }).sort((a,b) => { //now the sort
          let modifier = 1;
          if(this.reviewTable.currentSortDir === 'desc') modifier = -1;
          if (this.reviewTable.currentSort === 'date') {
            if(Date.parse(a[this.reviewTable.currentSort]) < Date.parse(b[this.reviewTable.currentSort])) return -1 * modifier;
            if(Date.parse(a[this.reviewTable.currentSort]) > Date.parse(b[this.reviewTable.currentSort])) return 1 * modifier;            
          } 
          if(a[this.reviewTable.currentSort] < b[this.reviewTable.currentSort]) return -1 * modifier;
          if(a[this.reviewTable.currentSort] > b[this.reviewTable.currentSort]) return 1 * modifier;
          return 0;
        }).filter((row, index) => {
          let start = (this.reviewTable.currentPage-1)*this.reviewTable.pageSize;
          let end = this.reviewTable.currentPage*this.reviewTable.pageSize;
          if(index >= start && index < end) return true;
        });
      }
    },
    methods: {
        nextPage:function() {
          if((this.postTable.currentPage*this.postTable.pageSize) < this.posts.length) this.postTable.currentPage++;
        },
        prevPage:function() {
          if(this.postTable.currentPage > 1) this.postTable.currentPage--;
        },
        nextReviewPage:function() {
          if((this.reviewTable.currentPage*this.reviewTable.pageSize) < this.posts.length) this.reviewTable.currentPage++;
        },
        prevReviewPage:function() {
          if(this.reviewTable.currentPage > 1) this.reviewTable.currentPage--;
        },
        sort(s) { // For Post Table
          //if s == current sort, reverse
          if(s === this.postTable.currentSort) {
            this.postTable.currentSortDir = this.postTable.currentSortDir==='asc'?'desc':'asc';
          }
          this.postTable.currentSort = s;
        },
        sortReviews(s) {
          //if s == current sort, reverse
          if(s === this.reviewTable.currentSort) {
            this.reviewTable.currentSortDir = this.reviewTable.currentSortDir==='asc'?'desc':'asc';
          }
          this.reviewTable.currentSort = s;
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
              setTimeout(()=>{location.reload()}, 1000);
              this.getRequests();
              this.updateMessage(res.data.message, alert_type='success')
            })
            .catch((error) => {              // eslint-disable-next-line
              console.log(error);
              this.getRequests();
            });
        },

        // reviews
        getReviews() {
          const path = `https://${this.host}/reviews`;
          axios.get(path)
            .then((res) => {
              this.reviews = res.data.reviews;
              this.username = res.data.username;
              // console.log(this.username) //shows old posts still...I think we should user this.markers to to loop through the markers and remove off the map...new methode removeMarkers()
              // setTimeout((() => {console.log(this.markers);this.updateMap(this.mg_map)}), 3000);
            })
            .catch((error) => {
              // eslint-disable-next-line
              // console.error(error);
            });
        },
        addReview(payload) { // actually posts data to db
          const path = `https://${this.host}/reviews`;
          axios.post(path, payload)
            .then((res) => {
              setTimeout(()=>{location.reload()}, 1000);
              this.getRequests();
              this.updateMessage(res.data.message, alert_type='success')
            })
            .catch((error) => {              // eslint-disable-next-line
              console.log(error);
              this.getRequests();
            });
        },
        // reviews

        updateRequest(payload, requestID) {
          const path = `https://${this.host}/posts/${requestID}`;
          axios.put(path, payload)
            .then(() => {
              setTimeout(()=>{location.reload()}, 1000);
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
          this.addReviewForm.review = '';
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
        onSubmitReview(evt) {
          $('#addReviewModal').modal('toggle')
          evt.preventDefault();
          console.log($('#addReview'))
          const payload = {
            review: this.addReviewForm.review,
          };
          console.log(payload)
          this.addReview(payload);
          this.initForm();
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



// Notes: 
// Good source for sorting and searching tables with pagination
// https://www.raymondcamden.com/2018/02/08/building-table-sorting-and-pagination-in-vuejs

// "Next Source"