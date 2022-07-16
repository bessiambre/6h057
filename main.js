const express = require('express');
const app = express();
const port = 3000;

//I started using fastify.io instead of express on new projects but since express is the requirement...

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(express.static('www'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});