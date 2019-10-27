const express = require('express');
const router = express.Router();
const config = require('./config.json');
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('mydb', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
});

sequelize.authenticate()
  .then(() => {
    console.log('Connected');
  }).catch(err => {
    console.log(`Can't connect ${err}`);
  });

const Model = Sequelize.Model;
class User extends Model { }
User.init({
  username: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
}, {
  sequelize,
  modelName: 'user',
  timestamps: false
});

let curUser;

const login = (req, res, next) => {
  const { username, password } = req.body;
  let user;
  User.findAll({
    where: { username, password }
  }).then(resolve => {
    const user = JSON.parse(JSON.stringify(resolve, null, 4))[0];
    // console.log(user);

    // if no found in the table
    if (user.length === 0) {
      res.status(400).send({ message: 'Username or password is incorrect' });
    }

    // save the found user in curUser for the change in the future
    curUser = Object.assign({}, user);

    const token = jwt.sign({ sub: user.username }, config.secret);

    User.findAll().then(resolve => {
      const users = JSON.parse(JSON.stringify(resolve, null, 4));
      res.send({
        users: users.map(u => {
          const { password, ...userWithoutPassword } = u;
          return userWithoutPassword;
        }),
        token
      });
    });
  }).catch(reject => res.status(400).send({ message: reject }));
}

const signup = (req, res, next) => {
  const { username, email, password } = req.body;
  console.log(`username->'${username}', email->'${email}', password->'${password}'`);
  User.create({
    username, email, password
  }).then(user => {
    curUser = Object.assign({}, user);
    const token = jwt.sign({ sub: user.username }, config.secret);

    User.findAll().then((resolve) => {
      const users = JSON.parse(JSON.stringify(resolve, null, 4));
      res.send({
        users: users.map(u => {
          const { password, ...userWithoutPassword } = u;
          return userWithoutPassword;
        }),
        token
      });
    });
  }).catch(err => {
    throw err;
  });
}

const changeMyData = (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization && authorization.split(' ')[0] === 'Bearer') {
    jwt.verify(authorization.split(' ')[1], config.secret, (err) => {
      if (err) {
        console.log('jwt incorrect');
        throw err;
      } else {
        console.log('jwt correct');
        console.log(curUser);
        const { username, email, password } = req.body;
        User.update({ username, email, password }, {
          where: curUser
        }).then(() => {
          curUser = Object.assign({}, curUser, { username, email, password });

          const token = jwt.sign({ sub: username }, config.secret);

          User.findAll().then(resolve => {
            const users = JSON.parse(JSON.stringify(resolve, null, 4));
            res.send({
              users: users.map(u => {
                const { password, ...userWithoutPassword } = u;
                return userWithoutPassword;
              }),
              token
            });
          });
        }).catch(reject => {
          console.log(`reject->${reject}`);
          res.status(400).send({ message: "can't update the data" });
        });
      }
    });
  } else {
    console.log('no authorization');
  }
}

// routes
router.post('/login', login);
router.post('/signup', signup);
router.get('/changemydata', changeMyData);

module.exports = router;