import { CollectionConfig } from "payload/types";



const pushTokens: CollectionConfig = {
    slug: 'pushTokens',
    fields: [
        {
            name: 'pushToken',
            type: 'text',
            label: 'Push Token'
        },
        {
            name: 'lastSend',
            type: "date",
            label: "Last Send"
        }
    ],
    endpoints: [
        {
            path: '/setPushToken',
            method: 'post',
            handler: async (req, res, next) => {
                const {token, userId} = req.body;

                try {
                const date = new Date()
                const newPushToken = await req.payload.create({
                    collection: 'pushTokens',
                    data: {
                        pushToken: token,
                        lastSend: date,
                    }
                })

                    const updatedUser = await req.payload.update({
                        collection: 'users',
                        id: userId,
                        data: {
                            pushTokens: newPushToken.id
                        }
                    })
                    res.status(200).send(updatedUser)
                } catch (error) {
                    const { data, message } = error;
                    res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
                }
            },
        },
    ],
}

export default pushTokens;