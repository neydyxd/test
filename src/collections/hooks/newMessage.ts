import type { AfterChangeHook } from 'payload/dist/collections/config/types'
import payload from "payload"

import axios from "axios"

export const newMessageHook: AfterChangeHook = async ({
  doc,
  req,
  req: { payload, body = {}, res },
  operation,
}) => {

  try {

    const API_URL = process.env.NODE_ENV === 'development' ? process.env.API_URL_DEV : "https://matchy-payload-dev.payloadcms.app";


    const user = await req.payload.findByID({
      collection: "users",
      id: doc.to,
      depth: 4
    })

    const user_from = await req.payload.findByID({
      collection: "users",
      id: doc.from,
      depth: 4
    })
  
    const tokens = user.pushTokens as any[];

    let pushTokens = [];

    let resultTokens = [];

    for (const token of tokens) {
      const now = new Date();
      const fiveSecondsAgo = new Date(now.getTime() - 5000);
      const lastSend = new Date(token.lastSend)
      if (fiveSecondsAgo.getTime() > lastSend.getTime()) {
        pushTokens.push(token.pushToken)
        resultTokens.push(token)
      } else {
        console.log("It hasn't been long")
      }
    }
    if (pushTokens.length !== 0) {

      axios.post(`${API_URL}/sendPushMessage`, {
        title: "Message",
        body: doc.content.content,
        data: {
          type: "MESSAGE",
          chatId: doc.chatId,
          partnerId: doc.from,
          partnerName: user_from.name,
          partnerPhoto: user_from.avatar
        },
        pushTokens: pushTokens
      })
        .then((r) => {
          console.log(r.data)
          const date = new Date();
          for (const token of resultTokens) {
            payload.update({
              collection: "pushTokens",
              id: token.id,
              data: {
                lastSend: date
              }
            })
          }
        })
        .catch((err) => {
          console.log(err.message)
        })
    }

    return doc;

  } catch (err) {
    console.log(err)
  }
}