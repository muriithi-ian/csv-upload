
const express = require('express');
const cors = require('cors')

const fs = require('fs');
const multer = require('multer');
const csv = require('fast-csv');
const async = require('async');

const probe = require('probe-image-size');
const urlExists = require('url-exists');

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
      fileRows.shift()//remove header row

      //create object
      let responseData = { data: [], errors: [] }

      const data = (fileRows.map((fileRow, index) => {

        let imageSize = {}

        let urlExist = urlExists(fileRow[2], async (_, exists) => {
          return exists;
        })
        setTimeout(() => { }, 1000)

        if (urlExist) {
          const imageData = probe(fileRow[2])
            .then((response) => {

              return {
                id: fileRow[0],
                name: fileRow[1],
                picture: {
                  url: fileRow[2],
                  width: response.width,
                  height: response.height,
                }
              }

            })
            .catch(err => {
              responseData.errors.push(index + ' image not found')

            })

          return {
            id: fileRow[0],
            name: fileRow[1],
            picture: {
              url: fileRow[2],
              width: imageData.width,
              height: imageData.height,
            }
          }
        }

        responseData.errors.push(index + ' image not found');
        return {
          id: fileRow[0],
          name: fileRow[1],
          picture: {
            url: fileRow[2],
            width: 'Not found',
            height: 'Not found',
          }
        }

      }))

      responseData.data = [...data]

      res.send(responseData)
    })
});

app.use('/upload-csv', router);

const port = process.env.PORT || 5000
app.listen(port, () => {
  console.log(`server started on port ${port}: http://localhost:${port}`)
})
