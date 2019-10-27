const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('./error-handler');
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use('/', require('./user-controller'));

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});