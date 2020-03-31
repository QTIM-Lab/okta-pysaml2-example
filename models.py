
# - Import Options- #

# There is a better way but for now you need to:
# 
# [1] Run line with __main__ for running the server:
from __main__ import db, UserMixin

# Switch to:

# [2] For running "recreate_db()" from app.py
# from app import db, UserMixin

### Note: ###
# Example of running recreate_db() and using line [2] below:
# $ . venv/bin/activate
# $ python

# >>> import app
# >>> app.recreate_db(app)







class User(db.Model, UserMixin): #UserMixin, when ready
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, index=True)
    email = db.Column(db.String(64), unique=True, index=True)
    address = db.Column(db.String(64), unique=True, index=True)
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    
    # Relatoinships
    post = db.relationship('Post', backref='user', cascade="all, delete-orphan" , lazy='dynamic')

    def __repr__(self):
        return '<User: %r>' % self.name

    def serialize(self):
       """Return object data in easily serializable format"""
       return {
           'id'         : self.id,
           'name': self.name,
           'address': self.address,
           'lat': self.lat,
           'lng': self.lng,
       }


class Post(db.Model):
    __tablename__ = 'posts'
    # Columns
    id = db.Column(db.Integer, primary_key=True)
    userId = db.Column(db.Integer, db.ForeignKey('users.id'))
    request = db.Column(db.Text())
    requestType = db.Column(db.String(64))
    canHelp = db.Column(db.Boolean())
    needHelp = db.Column(db.Boolean())
    status = db.Column(db.String(64))

    def __repr__(self):
        return '<Post: %r>' % self.request[0:20]

    def serialize(self):
       """Return object data in easily serializable format"""
       return {
           'id'         : self.id,
           'userId': self.userId,
           'request': self.request,
           'requestType': self.requestType,
           'canHelp': self.canHelp,
           'needHelp': self.needHelp,
           'status': self.status,
       }