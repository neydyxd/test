import express from 'express'
import payload from 'payload'
const admin = require("firebase-admin");
const credentials = require("../matchy-astro-firebase-adminsdk-j7ddm-60fd5b7092.json")

admin.initializeApp({
  credential: admin.credential.cert(credentials)
});


require('dotenv').config()
const app = express()

app.use(express.json())

// Redirect root to Admin panel
app.get('/', (_, res) => { res.redirect('/admin') })

const start = async () => {
  // Initialize Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    express: app,
    onInit: async () => { payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`) },
  })

  app.post('/sendPushMessage', (req, res) => {

    try {

      const { title, body, data, pushTokens } = req.body
      if (!title || !body || !pushTokens || !data) {
        return res.status(400).json({ error: 'Missing required parameters' })
      }

      const message = {
        notification: {
          title: title,
          body: body
        },
        data: data,
        tokens: pushTokens
      };

      admin.messaging().sendMulticast(message)
        .then((resol) => {
          res.status(200).send(resol)
        })
        .catch((error) => {
          res.status(500).send(error)
        })
    } catch (error) {
      res.status(500).send("Something went wrong")
    }
  })

  app.post('/testPush', (req, res) => {

    const { title, body, data, pushTokens } = req.body
    if (!title || !body || !data || !pushTokens) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    const message = {
      notification: {
        title: title,
        body: body
      },
      data: data,
      tokens: pushTokens
    };

    admin.messaging().sendMulticast(message)
      .then((resol) => {
        res.status(200).send(resol)
      })
      .catch((error) => {
        res.status(500).send(error)
      })
  })

  app.listen(3000)
}

start()