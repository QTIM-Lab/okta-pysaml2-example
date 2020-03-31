
# - Import Options- #

# There is a better way but for now you need to run the first ([1]) line for running the server
# and switch to the second ([2]) for running "recreate_db()" from app:

# >>> import app
# >>> app.recreate_db(app)


from __main__ import db, UserMixin # [1] For running the app
# from app import db, UserMixin # [2] DB manipulation outside app



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