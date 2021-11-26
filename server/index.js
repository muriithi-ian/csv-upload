
const express = require('express');
const cors = require('cors')

const http = require('http');
const fs = require('fs');
const multer = require('multer');
const csv = require('fast-csv');

const Router = express.Router;

//temp storage for csv
const upload = multer({ dest: './tmp/csv' });
const app = express();
const router = new Router();


app.use(cors())

app.get('/', (req, res) => {
  res.send('This is from express.js')
})

//upoad csv route
router.post('/', upload.single('file'), function (req, res) {
  let path = req.file.path.replaceAll('\\', '/');
  const fileRows = [];

  // open uploaded file
  csv.parseFile(path, { delimiter: ';' })
    .on('error', error => {
      res.send(error)
    })
    .on("data", function (data) {
      fileRows.push(data); // push each row
    })
    .on("end", function () {
      fs.unlinkSync(path);   // remove temp file

      //process "fileRows" and respond
      console.log(fileRows.shift())//remove header row
      res.send(fileRows)
    })
});

app.use('/upload-csv', router);

const port = process.env.PORT || 5000
app.listen(port, () => {
  console.log(`server started on port ${port}: http://localhost:${port}`)
})
