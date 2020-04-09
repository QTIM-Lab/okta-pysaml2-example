# -*- coding: utf-8 -*-
# Copyright 2015 Okta, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import logging, os, uuid, datetime as dt

from flask import (
    Flask,
    redirect,
    render_template,
    request,
    session,
    url_for,
    jsonify,
)
from flask_login import (
    LoginManager,
    UserMixin,
    current_user,
    login_required,
    login_user,
    logout_user,
)

from flask_cors import CORS

from flask_bootstrap import Bootstrap
from saml2 import (
    BINDING_HTTP_POST,
    BINDING_HTTP_REDIRECT,
    entity,
)
from saml2.client import Saml2Client
from saml2.config import Config as Saml2Config
import requests

# metadata_url_for contains PER APPLICATION configuration settings.
# Each SAML service that you support will have different values here.
#
# NOTE:
#   This is implemented as a dictionary for DEMONSTRATION PURPOSES ONLY.
#   On a production system, this information should be stored as approprate
#   for your concept of "customer company", "group", "organization", or "team"
metadata_url_for = {
    'example-okta-com': 'https://dev-942176.okta.com/app/exk50kb6gWzX9CStj4x6/sso/saml/metadata'
    # 'partners-mgh-okta-com': 'https://partnershealthcare.okta.com/app/partnershealthcare_communityhelpmgh_1/exk3f7lgfdSGdSsXE297/sso/saml'
    # 'partners-mgh-okta-com':'https://partnershealthcare.okta.com/app/exk3f7lgfdSGdSsXE297/sso/saml/metadata'
    # For testing with http://saml.oktadev.com use the following:
    # 'test': 'http://idp.oktadev.com/metadata',
    # WARNING WARNING WARNING
    #   You MUST remove the testing IdP from a production system,
    #   as the testing IdP will allow ANYBODY to log in as ANY USER!
    # WARNING WARNING WARNING
    }


app = Flask(__name__)
CORS(app)

Bootstrap(app)
app.secret_key = str(uuid.uuid4())  # Replace with your secret key
login_manager = LoginManager()
login_manager.setup_app(app)
logging.basicConfig(level=logging.DEBUG)
# NOTE:
#   This is implemented as a dictionary for DEMONSTRATION PURPOSES ONLY.
#   On a production system, this information must come
#   from your system's user store.


# from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'sqlite:///' + os.path.join(basedir, 'posts.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
from models import User, Post
# Below line is not being used but was part of an example 
user_store = {'bbearce@gmail.com': {}} # {'FirstName':'Benjamin','LastName':'Bearce'}}


# - Helper Functions - #

def recreate_db(app=app, User=User, Post=Post):
    db = app.db
    db.drop_all()
    db.create_all()
    user1 = User(id=1, name='Ben Bearce', partnersID='bbearce@gmail.com', email='bbearce@gmail.com')
    user2 = User(id=2, name='Cloud Bearce', partnersID='bbearce@bu.edu', email='bbearce@bu.edu')

    post1 = Post(userId=user1.id, 
                 post="Toilet paper is out in my area", 
                 requestType='inHouseHelp', 
                 helpType="needHelp", 
                 status='un-resolved',
                 date=dt.datetime(2020, 3, 1),
                 address='23 Aldie St. Allston, MA 02134',
                 lat=42.359002,
                 lng=-71.1358664
                 )

    post2 = Post(userId=user1.id, 
                 post="Baby formula is out of stock here.", 
                 requestType='inHouseHelp', 
                 helpType="needHelp", 
                 status='un-resolved',
                 date=dt.datetime(2020, 3, 5),
                 address='Boston, MA', 
                 lat=42.3601, 
                 lng=-71.0589)

    post3 = Post(userId=user2.id, 
                 post="If anyone needs help shopping, let me know.", 
                 requestType='shopping', 
                 helpType="canHelp", 
                 status='un-resolved',
                 date=dt.datetime(2020, 3, 10),
                 address='West Roxbury, Boston, MA', 
                 lat=42.2797554, 
                 lng=-71.1626756)
    
    post4 = Post(userId=user2.id, 
                 post="Can someone watch my dog?", 
                 requestType='shopping', 
                 helpType="needHelp", 
                 status='un-resolved',
                 date=dt.datetime(2020, 3, 12),
                 address='Fenway, Boston, MA', 
                 lat=42.3428653,
                 lng=-71.1002881)

    post5 = Post(userId=user2.id, 
                 post="I can give people rides here every other day.", 
                 requestType='transportation', 
                 helpType="canHelp", 
                 status='un-resolved',
                 date=dt.datetime(2020, 3, 15),
                 address='Watertown, MA', 
                 lat=42.3709299, 
                 lng=	-71.1828321)

    post6 = Post(userId=user1.id, 
                 post="	I can watch pets for people, but they need to bring them to me.", 
                 requestType='petCare', 
                 helpType="canHelp", 
                 status='un-resolved',
                 date=dt.datetime(2020, 3, 17),
                 address='Weston, MA', 
                 lat=42.3667625, 
                 lng=-71.3031132)

    post7 = Post(userId=user1.id, 
                 post="I drive by here everyday going to Charlestown. Let me know if anyone needs a car pool from the city.", 
                 requestType='transportation', 
                 helpType="canHelp", 
                 status='un-resolved',
                 date=dt.datetime(2020, 3, 20),
                 address='Central Rock, Boston, MA', 
                 lat=42.3651607, 
                 lng=-71.0589878)

    post8 = Post(userId=user1.id, 
                 post="Flour is out of stock everywhere I go. Does anyone have extra?", 
                 requestType='shopping', 
                 helpType="needHelp", 
                 status='un-resolved',
                 date=dt.datetime(2020, 3, 27),
                 address='Medford, MA', 
                 lat=42.2797554, 
                 lng=-71.1061639)

    post9 = Post(userId=user1.id, 
                 post="We are totally out of eggs. Can anyone spare 3-6? I'm trying to make a couple cakes and would be willing to share! :)", 
                 requestType='shopping', 
                 helpType="needHelp", 
                 status='un-resolved',
                 date=dt.datetime(2020, 4, 1),
                 address='Newton, MA', 
                 lat=42.3370413, 
                 lng=-71.2092214)

    post10 = Post(userId=user2.id, 
                 post="Can I get a one time ride out to Dorchester. I need to make a pickup and don't want to get a ride share at the moment with everything going on. Am willing to car pool with other MGH employees who don't have symptoms.", 
                 requestType='transportation', 
                 helpType="needHelp", 
                 status='un-resolved',
                 date=dt.datetime.now(),
                 address='Dorchester, MA', 
                 lat=42.3016305, 
                 lng=-71.067605)

    db.session.add_all([user1,user2,post1,post2,post3,post4,post5,post6,post7,post8,post9,post10])
    db.session.commit()


def saml_client_for(idp_name=None):
    '''
    Given the name of an IdP, return a configuation.
    The configuration is a hash for use by saml2.config.Config
    '''

    if idp_name not in metadata_url_for:
        raise Exception("Settings for IDP '{}' not found".format(idp_name))
    acs_url = url_for(
        "idp_initiated",
        idp_name=idp_name,
        _external=True)
    https_acs_url = url_for(
        "idp_initiated",
        idp_name=idp_name,
        _external=True,
        _scheme='https')

    #   SAML metadata changes very rarely. On a production system,
    #   this data should be cached as approprate for your production system.
    rv = requests.get(metadata_url_for[idp_name])

    settings = {
        'metadata': {
            'inline': [rv.text],
            },
        'service': {
            'sp': {
                'endpoints': {
                    'assertion_consumer_service': [
                        (acs_url, BINDING_HTTP_REDIRECT),
                        (acs_url, BINDING_HTTP_POST),
                        (https_acs_url, BINDING_HTTP_REDIRECT),
                        (https_acs_url, BINDING_HTTP_POST)
                    ],
                },
                # Don't verify that the incoming requests originate from us via
                # the built-in cache for authn request ids in pysaml2
                'allow_unsolicited': True,
                # Don't sign authn requests, since signed requests only make
                # sense in a situation where you control both the SP and IdP
                'authn_requests_signed': False,
                'logout_requests_signed': True,
                'want_assertions_signed': True,
                'want_response_signed': False,
            },
        },
    }
    spConfig = Saml2Config()
    spConfig.load(settings)
    spConfig.allow_unknown_attributes = True
    saml_client = Saml2Client(config=spConfig)
    return saml_client


class User_SAML(UserMixin):
    def __init__(self, user_id):
        user = {}
        self.id = None
        self.first_name = None
        self.last_name = None
        try:
            user = user_store[user_id]
            self.id = unicode(user_id)
            self.first_name = user['first_name']
            self.last_name = user['last_name']
        except:
            pass


@login_manager.user_loader
def load_user(user_id):
    return User_SAML(user_id)

# - Views - #
# SAML Code

@app.route("/")
def main_page():
    return render_template('main_page.html', idp_dict=metadata_url_for, session=session)


@app.route("/saml/sso/<idp_name>", methods=['POST'])
def idp_initiated(idp_name):
    saml_client = saml_client_for(idp_name)
    authn_response = saml_client.parse_authn_request_response(
        request.form['SAMLResponse'],
        entity.BINDING_HTTP_POST)
    authn_response.get_identity() # First and Last name...not email
    authn_response.ava # First and Last name...not email...same as above
    user_info = authn_response.get_subject() # a response tag
    username = user_info.text # email address from response tag text
    
    print("""

    user_store: {}
    idp_name: {}
    saml_client: {}
    authn_response: {}
    authn_response.ava: {}
    username: {}
    user_info: {}

    """.format(user_store,idp_name,saml_client,authn_response, authn_response.ava,username,user_info))



    # This is what as known as "Just In Time (JIT) provisioning".
    # What that means is that, if a user in a SAML assertion
    # isn't in the user store, we create that user first, then log them in

    # Original Code
    if username not in user_store:
        user_store[username] = {
            'first_name': authn_response.ava['FirstName'][0],
            'last_name': authn_response.ava['LastName'][0],
            }
    user = User_SAML(username)

    # New sqlite Code
    # User

    session['user'] = username

    # changed templates/main_page.html to use session['user'] 
    # which is aliased as "username" above and is actually "authn_response.get_subject().text" \
    # and not "saml_attributes" which also came from the same response "authn_response.ava "
    session['saml_attributes'] = authn_response.ava
    login_user(user)
    url = url_for('user') # not getting used

    # NOTE:
    #   On a production system, the RelayState MUST be checked
    #   to make sure it doesn't contain dangerous URLs!
    if 'RelayState' in request.form:
        url = request.form['RelayState']
    print("[{}]".format(url))
    return redirect('/') # an empty string goes to the homepage which is what url_for(user) returns


@app.route("/saml/login/<idp_name>")
def sp_initiated(idp_name):
    saml_client = saml_client_for(idp_name)
    reqid, info = saml_client.prepare_for_authenticate()

    redirect_url = None
    # Select the IdP URL to send the AuthN request to
    for key, value in info['headers']:
        if key is 'Location':
            redirect_url = value
    response = redirect(redirect_url, code=302)
    # NOTE:
    #   I realize I _technically_ don't need to set Cache-Control or Pragma:
    #     http://stackoverflow.com/a/5494469
    #   However, Section 3.2.3.2 of the SAML spec suggests they are set:
    #     http://docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf
    #   We set those headers here as a "belt and suspenders" approach,
    #   since enterprise environments don't always conform to RFCs
    response.headers['Cache-Control'] = 'no-cache, no-store'
    response.headers['Pragma'] = 'no-cache'
    return response


@app.route("/user") # Route not built yet...no template
@login_required
def user():
    return render_template('user.html', session=session)


@app.errorhandler(401)
def error_unauthorized(error):
    return render_template('unauthorized.html')


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("main_page"))


# Map App

# Helper functions
# Helper for the update api
def remove_request(post_id):
    for request in db:
        if request['id'] == post_id:
            db.remove(Query().id == post_id)
            return True
    return False


# Below is just practicing that we can retrieve data from the DB. Not a real route.
@app.route("/ping", methods=['GET'])
@login_required
def ping():
    from models import User, Post
    user = User.query.filter_by(name='Ben Bearce').first()
    posts = [post.serialize() for post in Post.query.all()]
    return jsonify(response = 'pong!', user=user.serialize(), posts=posts)


@app.route('/posts', methods=['GET', 'POST'])
def all_requests(app=app, User=User, Post=Post):
    # response_object = {'status': 'success'}
    try:
        response_object = {'status': 'success', 
                           'username':session['user']
                          }
    except:
        response_object = {'status': 'success'}

    if request.method == 'POST':
        post_data = request.get_json()
        # Good print loop for seeing data you do\don't receive
        for i in post_data:
            print('{}: '.format(i),post_data.get(i))

        # Check if user exists yet
        if User.query.filter_by(partnersID=session['user']).first() != None:
            # user = User.query.filter_by(email=post_data.get('email')).first() ## Users can decide their email
            user = User.query.filter_by(partnersID=session['user']).first()
            user.name = post_data.get('name')
            db.session.add(user)
        else:
            # If not then make a new user
            new_user = User(
                name=post_data.get('name'), 
                partnersID=session['user'], 
                email=post_data.get('email'), # User defined
            )
            db.session.add(new_user)
            db.session.commit()
            user = User.query.filter_by(partnersID=session['user']).first()
        
        new_post = Post(
            userId=user.id, 
            post=post_data.get('post'), 
            address=post_data.get('address'), 
            lat=post_data.get('lat'), 
            lng=post_data.get('lng'),
            date=dt.datetime.now(),
            requestType=post_data.get('requestType'), 
            helpType=post_data.get('helpType'), 
            status=post_data.get('status')
        )
        db.session.add(new_post)
        db.session.commit()

        response_object['message'] = 'Response added for {}'.format(user.name)
    else:

        response_object['posts'] = [post.serialize() for post in Post.query.filter_by(status='un-resolved')]
    return jsonify(response_object)

# Login
# @app.route('/login', methods=['POST']) # Don't think this is being used...
# def login():
#     if request.method == 'POST':
#         response_object = {'status': 'POST'}
#         post_data = request.get_json()
#         # Check if user exists in db
#         User = Query()
#         user = db.search(User.email == post_data.get('email'))
#         response_object = {'status': 'POST', 'isUsr':False}
#         print("""
#         email: {}
#         passwd: {}
#         """.format(post_data.get('email'), post_data.get('password')))
#         if len(user) != 0:
#             response_object['isUsr'] = True;

#     elif request.method == 'GET':
#         response_object = {'status': 'GET'}
#     else:
#         response_object = {'status': 'Something Else...'}

#     return jsonify(response_object)


# Delete\Update api handler
@app.route('/posts/<post_id>', methods=['PUT', 'DELETE'])
def single_post(post_id):
    response_object = {'status': 'success'}
    if request.method == 'PUT':
        put_data = request.get_json()
        # remove_request(post_id)
        print("id: {}".format(post_id))
        print("name: {}".format(put_data.get('name')))
        print("email: {}".format(put_data.get('email')))
        print("address: {}".format(put_data.get('address')))
        print("lat: {}".format(put_data.get('lat')))
        print("long: {}".format(put_data.get('long')))
        print("request: {}".format(put_data.get('post')))
        print("requestType: {}".format(put_data.get('requestType')))
        print("helpType: {}".format(put_data.get('helpType')))
        print("status: {}".format(put_data.get('status')))

        post = Post.query.filter_by(id=post_id).first()
        user = User.query.filter_by(id=post.userId).first()

        post.post = put_data.get('post')
        post.requestType = put_data.get('requestType')
        post.helpType = put_data.get('helpType')
        post.status = put_data.get('status')
        post.address = put_data.get('address')
        post.lat = put_data.get('lat')
        post.lng = put_data.get('lng')
        post.date = dt.datetime.now()

        user.name = put_data.get('name')
        user.email = put_data.get('email')
        db.session.add(user)

        db.session.add(post)
        db.session.commit()

        response_object['message'] = 'Response updated for {}'.format(user.name)
    elif request.method == 'DELETE':
        # I left this code here as a template
        # in case we want this back for some reason. 
        # For those that see this in the future, this
        # has been disabled from the front end and 
        # is currently not reachable
        post = Post.query.filter_by(id=post_id).first()
        user = User.query.filter_by(id=post.userId).first()
        db.session.delete(post)
        db.session.commit()
        response_object['message'] = 'Response deleted for {}'.format(user.name)
    else:
        response_object['message'] = 'Request neither DELETE nor PUT...'
    return jsonify(response_object)

# Delete\Update api handler
@app.route('/tutorial', methods=['GET'])
def tutorial():
    return render_template('tutorial.html', idp_dict=metadata_url_for)



if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    if port == 5000:
        app.debug = True
    app.run(host='localhost', port=port)
