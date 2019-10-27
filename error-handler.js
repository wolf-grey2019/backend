const errorHandler = (req, res, err) => {
  if (typeof (err) === 'string') {
    console.log('custom application error');
    return res.status(400).send({ message: err });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).send({ message: 'Invalid Token' });
  }
  
  console.log('default error');
  console.log(err);
  return res.status(500).send({ message: err.message });
}

module.exports = errorHandler;