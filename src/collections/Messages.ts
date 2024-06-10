import { CollectionConfig } from "payload/types";
import payload from 'payload'
import { newMessageHook } from "./hooks/newMessage";

const Messages: CollectionConfig = {
    slug: 'messages',
    hooks: {
        afterChange: [newMessageHook]
    },
    fields: [
        {
            name: 'content',
            type: 'json',
            label: 'Content'
        },
        {
            name: 'from',
            type: 'relationship',
            relationTo: 'users',
            label: 'From'
        },
        {
            name: 'to',
            type: 'relationship',
            relationTo: 'users',
            label: 'To'
        },
        {
            name: 'messageId',
            type: 'text',
            label: 'Message Id'
        },
        {
            name: 'isRead',
            type: 'checkbox',
            label: 'Is Read'
        },
        {
            name: 'chatId',
            type: 'text',
            label: 'Chat Id'
        },

    ],
    endpoints: [
        {
            path: '/sendMedia',
            method: 'post',
            handler: async (req, res, next) => {

                const files = req.files.file;
                const { from, to, messageId } = req.body;

                try {
                    if (!from || !to || !files || !messageId) {
                        return res.status(400).json({ error: 'Missing required parameter:from or to or files or messageId' })
                    }
                    const alt = "Файл сообщения";

                    const chats = await req.payload.find({
                        collection: 'chats',
                        where: {
                            members: {
                                equals: from
                            }
                        },
                        depth: 4
                    })

                    const chates = chats.docs;
                    var findChat;
                    for (const chat of chates) {
                        if (chat.members) {
                            if ((chat.members[0].id === from && chat.members[1].id === to) || (chat.members[0].id === to && chat.members[1].id === from)) {
                                findChat = chat;
                            }
                        }
                    }

                    const chatId: string = findChat.id

                    if (files.length > 1) {
                        let newMediaData = [];
                        for (const file of files) {
                            const newMedia = await req.payload.create({
                                collection: 'mediaChats',
                                file: file,
                                data: {
                                    alt: alt
                                }
                            })

                            newMediaData.push(newMedia);
                        }

                        let newMessageData = [];
                        for (const newMedia of newMediaData) {
                            const newMessage = await req.payload.create({
                                collection: 'messages',
                                data: {
                                    from: from,
                                    to: to,
                                    content: {
                                        type: "GALLERY",
                                        content: newMedia.url
                                    },
                                    chatId: chatId,
                                    messageId: messageId
                                },
                                depth: 4
                            })


                            const messages = findChat.messages

                            let messagesId = [];

                            for (const message of messages) {
                                messagesId.push(message.id)
                            }

                            messagesId.push(newMessage.id)

                            const updateChat = await payload.update({
                                collection: 'chats',
                                id: chatId,
                                data: {
                                    lastMessage: newMessage.id,
                                    messages: messagesId
                                }
                            })

                            newMessageData.push(newMessage);
                        }

                        res.status(200).send(newMessageData)
                    } else {
                        const newMedia = await req.payload.create({
                            collection: 'mediaChats',
                            file: files,
                            data: {
                                alt: alt
                            }
                        })

                        const newMessage = await req.payload.create({
                            collection: 'messages',
                            data: {
                                from: from,
                                to: to,
                                content: {
                                    type: "GALLERY",
                                    content: newMedia.url
                                },
                                chatId: chatId,
                                messageId: messageId
                            },
                            depth: 4
                        })

                        const messages = findChat.messages

                        let messagesId = [];

                        for (const message of messages) {
                            messagesId.push(message.id)
                        }

                        messagesId.push(newMessage.id)

                        const updateChat = await payload.update({
                            collection: 'chats',
                            id: chatId,
                            data: {
                                lastMessage: newMessage.id,
                                messages: messagesId
                            }
                        })

                        res.status(200).send(newMessage)

                    }
                } catch (error) {
                    const { data, message } = error;
                    res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
                }
            },
        },
        {
            path: '/sendText',
            method: 'post',
            handler: async (req, res, next) => {

                const { text, from, to, messageId } = req.body;
                if (!from || !to || !text || !messageId) {
                    return res.status(400).json({ error: 'Missing required parameter:from or to or text or messageId' })
                }

                try {

                    const chats = await req.payload.find({
                        collection: 'chats',
                        where: {
                            members: {
                                equals: from
                            }
                        },
                        depth: 4
                    })

                    const chates = chats.docs;
                    var findChat;
                    for (const chat of chates) {
                        if (chat.members) {
                            if ((chat.members[0].id === from && chat.members[1].id === to) || (chat.members[0].id === to && chat.members[1].id === from)) {
                                findChat = chat;
                            }
                        }
                    }


                    const chatId: string = findChat.id

                    const newMessage = await req.payload.create({
                        collection: 'messages',
                        data: {
                            from: from,
                            to: to,
                            content: {
                                type: "TEXT",
                                content: text
                            },
                            chatId: chatId,
                            messageId: messageId
                        },
                        depth: 4
                    })

                    const messages = findChat.messages

                    let messagesId = [];



                    if (findChat.messages) {
                        for (const message of messages) {
                            messagesId.push(message.id)
                        }
                    }

                    messagesId.push(newMessage.id)

                    const updateChat = await payload.update({
                        collection: 'chats',
                        id: chatId,
                        data: {
                            lastMessage: newMessage.id,
                            messages: messagesId
                        }
                    })
                    res.status(200).send(newMessage)
                } catch (error) {
                    const { data, message } = error;
                    res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
                }
            },
        },
    ]
}

export default Messages;