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
import logging
import os
import uuid

from flask import (
    Flask,
    redirect,
    render_template,
    request,
    session,
    url_for,
    jsonify,
)
from flask.ext.login import (
    LoginManager,
    UserMixin,
    current_user,
    login_required,
    login_user,
    logout_user,
)
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
    # For testing with http://saml.oktadev.com use the following:
    # 'test': 'http://idp.oktadev.com/metadata',
    # WARNING WARNING WARNING
    #   You MUST remove the testing IdP from a production system,
    #   as the testing IdP will allow ANYBODY to log in as ANY USER!
    # WARNING WARNING WARNING
    }


app = Flask(__name__)

Bootstrap(app)
app.secret_key = str(uuid.uuid4())  # Replace with your secret key
login_manager = LoginManager()
login_manager.setup_app(app)
logging.basicConfig(level=logging.DEBUG)
# NOTE:
#   This is implemented as a dictionary for DEMONSTRATION PURPOSES ONLY.
#   On a production system, this information must come
#   from your system's user store.
user_store = {'bbearce@gmail.com': {}} # {'FirstName':'Benjamin','LastName':'Bearce'}}

# from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'sqlite:///' + os.path.join(basedir, 'posts.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
from models import User, Post

print(User.query.all())

def recreate_db(app=app, User=User, Post=Post):
    db = app.db
    db.drop_all()
    db.create_all()
    user1 = User(id=1, name='Ben Bearce', email='bbearce@gmail.com', address='23 Aldie St. Allston, MA 02134', lat=0, lng=0)
    user2 = User(id=2, name='Kyle Schluns', email='kschluns@gmail.com', address='The Viridian ,Boston, MA', lat=0, lng=0)
    user3 = User(id=3, name='Miriam Blackwater', email='mblackwater@gmail.com', address='Boston, MA', lat=0, lng=0)

    post1 = Post(userId=user1.id, request="Toilet paper is out in my area", requestType='inHouseHelp', canHelp=False, needHelp=True, status='un-resolved')
    post2 = Post(userId=user1.id, request="Baby formula is out of stock here.", requestType='inHouseHelp', canHelp=False, needHelp=True, status='un-resolved')
    post3 = Post(userId=user2.id, request="If anyone needs help shopping, let me know.", requestType='shopping', canHelp=True, needHelp=False, status='un-resolved')
    post4 = Post(userId=user3.id, request="I have a care if anyone needs it", requestType='transportation', canHelp=True, needHelp=False, status='un-resolved')
    db.session.add_all([user1,user2,user3,post1,post2,post3,post4])
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


class User(UserMixin):
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
    return User(user_id)


@app.route("/")
def main_page():
    return render_template('main_page.html', idp_dict=metadata_url_for)

@app.route("/ping", methods=['GET'])
def ping():
    from models import User, Post
    user = User.query.filter_by(name='Ben Bearce').first()
    # post = Post.query.filter_by(userId=user.id).first()
    posts = [post.serialize() for post in Post.query.all()]
    print(user)
    print(user.serialize())
    return jsonify(response = 'pong!', user=user.serialize(), posts=posts)



@app.route("/saml/sso/<idp_name>", methods=['POST'])
def idp_initiated(idp_name):
    saml_client = saml_client_for(idp_name)
    authn_response = saml_client.parse_authn_request_response(
        request.form['SAMLResponse'],
        entity.BINDING_HTTP_POST)
    authn_response.get_identity()
    user_info = authn_response.get_subject()
    username = user_info.text
    
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
    if username not in user_store:
        user_store[username] = {
            'first_name': authn_response.ava['FirstName'][0],
            'last_name': authn_response.ava['LastName'][0],
            }
    user = User(username)
    session['saml_attributes'] = authn_response.ava
    login_user(user)
    url = url_for('user')

    # NOTE:
    #   On a production system, the RelayState MUST be checked
    #   to make sure it doesn't contain dangerous URLs!
    if 'RelayState' in request.form:
        url = request.form['RelayState']
    return redirect(url)


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


@app.route("/user")
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

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    if port == 5000:
        app.debug = True
    app.run(host='localhost', port=port)
