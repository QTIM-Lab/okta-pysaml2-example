
# - Import Options- #

# There is a better way but for now you need to:
# 
# [1] Run line with __main__ for running the server:
from __main__ import db, UserMixin

# Switch to:

# [2] For running "recreate_db()" from app.py
# from app import db, UserMixin
# 
### Note: ###
# Example of running recreate_db() and using line [2] below:
# $ . venv/bin/activate
# $ python

# >>> import app
# >>> app.recreate_db(app)



class User(db.Model, UserMixin): #UserMixin, when ready
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(64), index=True)
    partnersID = db.Column(db.String(64), unique=True, index=True)
    email = db.Column(db.String(64), index=True)
    
    # Relatoinships
    post = db.relationship('Post', backref='user', cascade="all, delete-orphan" , lazy='dynamic')

    def __repr__(self):
        return '<User: %r>' % self.name

    def serialize(self):
       """Return object data in easily serializable format"""
       return {
           'id' : self.id,
           'name': self.name,
           'partnersID': self.partnersID,
           'email': self.email,
       }


class Post(db.Model):
    __tablename__ = 'posts'
    # Columns
    id = db.Column(db.Integer, primary_key=True)
    userId = db.Column(db.Integer, db.ForeignKey('users.id'))
    post = db.Column(db.Text())
    address = db.Column(db.String(64), index=True)
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    date=db.Column(db.DateTime())
    requestType = db.Column(db.String(64))
    helpType = db.Column(db.String(64))
    status = db.Column(db.String(64))

    def __repr__(self):
        return '<Post: %r>' % self.userId

    def serialize(self):
       """Return object data in easily serializable format"""
       return {
           'id' : self.id, # native property
           'userId': self.userId, # native property
           'name': User.query.filter_by(id=self.userId).first().name,
           'partnersID': User.query.filter_by(id=self.userId).first().partnersID,
           'email': User.query.filter_by(id=self.userId).first().email,
           'address': self.address,
           'lat': self.lat,
           'lng': self.lng,
           'date': self.date, # self.date.strftime('%x'), # If you want to format it going in. Currently letting JS handle formatting
           'post': self.post, # native property
           'requestType': self.requestType, # native property
           'helpType': self.helpType, # native property
           'status': self.status, # native property
       }