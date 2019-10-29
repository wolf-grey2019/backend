const express = require('express');
const router = express.Router();
const config = require('./config.json');
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');

const saltOrRounds = 10;

const sequelize = new Sequelize('kUmw0n1Ziw', 'kUmw0n1Ziw', 'Y2XIb0BSp3', {
host: 'remotemysql.com',
// const sequelize = new Sequelize('mydb', 'root', '', {
//   host: 'localhost',
  dialect: 'mysql'
});

sequelize.authenticate().then(() => {
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

const login = (req, res, next) => {
  const { username, password } = req.body;
  console.log(`username->'${username}', password->'${password}'`);

  User.findAll({
    where: { username }
  }).then(resolve => {
    const user = JSON.parse(JSON.stringify(resolve, null, 4))[0];
    // console.log(user);

    // if match data not found in the table
    if (user === undefined) {
      res.status(400).send({ message: 'Username incorrect' });
    }

    bcrypt.compare(password, user.password, (err, same) => {
      if (err) throw err;
      if (same) {
        // password is correct
        const token = jwt.sign({ sub: user.id }, config.secret);

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
      } else {
        res.status(400).send({ message: 'Password incorrect' });
      }
    });
  }).catch(reject => res.status(400).send({ message: reject }));
}

const signup = (req, res, next) => {
  const { username, email, password } = req.body;
  console.log(`username->'${username}', email->'${email}', password->'${password}'`);

  // if table "users" in database, then add the following data
  // if no table "users" in database, then create it
  User.sync({ force: false }).then(() => {
    // bcrypt the password
    bcrypt.hash(password, saltOrRounds, (err, password) => {
      if (err) throw err;
      // add the new data with username, email, password
      User.create({
        username, email, password
      }).then(user => {
        const token = jwt.sign({ sub: user.id }, config.secret);

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
    })

  });
}

const changeMyData = (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization && authorization.split(' ')[0] === 'Bearer') {
    jwt.verify(authorization.split(' ')[1], config.secret, (err, token) => {
      if (err) {
        console.log('jwt incorrect');
        throw err;
      } else {
        console.log(token);
        console.log('jwt correct');
        const { username, email, password } = req.body;

        User.update({ username, email, password }, {
          where: { id: token.sub }
        }).then(() => {
          User.findAll().then(resolve => {
            const users = JSON.parse(JSON.stringify(resolve, null, 4));
            res.send({
              users: users.map(u => {
                const { password, ...userWithoutPassword } = u;
                return userWithoutPassword;
              })
            });
          });
        }).catch(reject => {
          console.log(`reject->${reject}`);
          res.status(400).send({ message: "can't update the data" });
        });
      }
    });
  } else {
    console.log('token needed');
  }
}

// routes
router.post('/login', login);
router.post('/signup', signup);
router.get('/changemydata', changeMyData);

module.exports = router;