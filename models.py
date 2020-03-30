from flask_sqlalchemy import SQLAlchemy
from flask.ext.login import UserMixin
from flask_migrate import Migrate

db = SQLAlchemy()

class User(db.Model, UserMixin): #UserMixin, when ready
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, index=True)
    email = db.Column(db.String(64), unique=True, index=True)
    address = db.Column(db.String(64), unique=True, index=True)
    
    # Relatoinships
    post = db.relationship('Post', backref='user', cascade="all, delete-orphan" , lazy='dynamic')

    def __repr__(self):
        return '<User: %r>' % self.name


class Post(db.Model):
    __tablename__ = 'posts'
    # Columns
    id = db.Column(db.Integer, primary_key=True)
    userId = db.Column(db.Integer, db.ForeignKey('users.id'))
    address = db.Column(db.String(64))
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    request = db.Column(db.Text())
    requestType = db.Column(db.String(64))
    canHelp = db.Column(db.Boolean())
    needHelp = db.Column(db.Boolean())

    def __repr__(self):
        return '<Post: %r>' % self.request[0:20]
