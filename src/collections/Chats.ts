import payload from "payload";
import { CollectionConfig } from "payload/types";

const Chats: CollectionConfig = {
    slug: 'chats',
    fields: [
        {
            name: 'lastMessage',
            type: 'relationship',
            relationTo: 'messages',
            label: 'Last Message'
        },
        {
            name: 'members',
            type: 'relationship',
            relationTo: 'users',
            hasMany: true,
            label: 'Members'
        },
        {
            name: 'messages',
            type: 'relationship',
            relationTo: 'messages',
            hasMany: true,
            label: 'Messages'
        },
    ],
    endpoints: [
        {
            path: '/getAllChats',
            method: 'post',
            handler: async (req, res, next) => {
                const { userId } = req.body;
                try {


                    if (!userId) {
                        return res.status(400).json({ error: 'Missing required parameter: userId' })
                    }

                    const chats = await req.payload.find({
                        collection: 'chats',
                        where: {
                            members: {
                                equals: userId
                            }
                        },
                        depth: 5
                    })
                    res.status(200).json(chats.docs)
                } catch (error) {
                    const { data, message } = error;
                    res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
                }
            },
        },
        {
            path: '/getChatMessages',
            method: 'post',
            handler: async (req, res, next) => {
                const { chatId } = req.body;
                try {
                    if (!chatId) {
                        return res.status(400).json({ error: 'Missing required parameter: chatId' })
                    }

                    const chat = await payload.findByID({
                        collection: 'chats',
                        id: chatId,
                        depth: 3
                    })

                    const numMessagesPerPage = 5;
                    const page = req.body.page ? Number(req.body.page) : 1;
                    const startIndex = (page - 1) * numMessagesPerPage;
                    const endIndex = startIndex + numMessagesPerPage;

                    const messages = (chat.messages as any[]).slice(startIndex, endIndex);
                    res.status(200).json(messages)
                } catch (error) {
                    const { data, message } = error;
                    res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
                }
            },
        },
        {
            path: '/createChat',
            method: 'post',
            handler: async (req, res, next) => {
                const { user_1, user_2 } = req.body;
                try {
                    if (!user_1 || !user_2) {
                        return res.status(400).json({ error: 'Missing required parameter: user_1 or user_2' })
                    }
                    const chats = await req.payload.find({
                        collection: 'chats',
                        where: {
                            members: {
                                equals: user_1
                            }
                        },
                        depth: 3,
                        draft: false
                    })

                    const chates = chats.docs;
                    let findChat;
                    for (const chat of chates) {
                        if (chat.members) {
                            if ((chat.members[0].id === user_1 && chat.members[1].id === user_2) || (chat.members[0].id === user_2 && chat.members[1].id === user_1)) {
                                findChat = chat;
                            }
                        }
                    }
                    if (!findChat) {
                        const newChat = await req.payload.create({
                            collection: 'chats',
                            data: {
                                members: [user_1, user_2]
                            },
                            depth: 3,
                            draft: false
                        })
                        res.status(200).send(newChat)
                    }
                    res.status(200).send(findChat)
                } catch (error) {
                    const { data, message } = error;
                    res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
                }
            },
        },
    ],
}

export default Chats;