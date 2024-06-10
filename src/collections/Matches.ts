import { CollectionConfig } from "payload/types";
import axios from "axios"

const Matches: CollectionConfig = {
    slug: 'matches',
    fields: [
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
            name: 'isShow',
            type: 'checkbox',
            label: 'Is Show'
        },
        {
            name: 'status',
            type: 'select',
            options: [
                {
                    label: "Like",
                    value: "LIKE"
                },
                {
                    label: "Reject",
                    value: "REJECT"
                }
            ]
        },
    ],
    endpoints: [
        {
            path: '/getDiscoveryData',
            method: 'post',
            handler: async (req, res, next) => {
                try {
                    const { gender, lookingGender, userId, ageFrom, ageTo, latitude, longitude, radius, page} = req.body;

                    if (!ageFrom || !ageTo || !gender || !lookingGender || !latitude || !longitude || !radius || !page) {
                        return res.status(400).json({ error: 'Missing required parameters' });
                    }

                    const currentDate = new Date();
                    const fromDate = new Date(currentDate.getFullYear() - ageFrom, currentDate.getMonth(), currentDate.getDate());
                    const toDate = new Date(currentDate.getFullYear() - ageTo - 1, currentDate.getMonth(), currentDate.getDate());

                    const findData = await req.payload.find({
                        collection: 'users',
                        where: {
                            coordinates: {
                                near: [longitude, latitude, radius * 1000, 0],
                            },
                            birth: {
                                greater_than_equal: toDate,
                                less_than_equal: fromDate,
                            },
                            gender: {
                                equals: lookingGender,
                            },
                            lookingGender: {
                                equals: gender,
                            },
                        },
                        depth: 4,
                        limit:20,
                        page: page
                    });

                    res.status(200).json(findData);
                } catch (error) {
                    const { data, message } = error;
                    res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
                }
            },
        },
        {
            path: '/handleLike',
            method: 'post',
            handler: async (req, res, next) => {
                try {
                    const { from, to } = req.body;

                    if (!from || !to) {
                        return res.status(400).json({ error: 'Missing required parameter: from or to' })
                    }

                    const findMatches = await req.payload.find({
                        collection: 'matches',
                        where: {
                            from: {
                                equals: from
                            },
                            to: {
                                equals: to
                            },
                            status: {
                                equals: "LIKE"
                            },
                        },
                    })

                    if (findMatches.docs.length === 0) {
                        const newMatch = await req.payload.create({
                            collection: 'matches',
                            data: {
                                from: from,
                                to: to,
                                status: "LIKE",
                                isShow: false
                            },
                        })
                    }

                    const matches = await req.payload.find({
                        collection: 'matches',
                        where: {
                            from: {
                                equals: to
                            },
                            to: {
                                equals: from
                            },
                            status: {
                                equals: "LIKE"
                            },
                            isShow: {
                                equals: false
                            },
                        },
                        depth: 4,
                    })

                    if (matches.docs.length === 0) {
                        res.status(200).send()
                    } else {
                        res.status(200).json(matches.docs[0])
                        const API_URL = process.env.NODE_ENV === 'development' ? process.env.API_URL_DEV : "https://matchy-payload-dev.payloadcms.app";
                        const match = matches.docs[0]

                        const user_from = match.from as any;
                        const tokens_from = user_from.pushTokens as any[];

                        let pushTokensFrom = [];

                        for (const token of tokens_from) {
                            pushTokensFrom.push(token.pushToken)
                        }

                        axios.post(`${API_URL}/sendPushMessage`, {
                            title: "Push",
                            body: "New match",
                            data: {
                                type: "MATCH",
                                matchId: match.id,
                                sender: JSON.stringify(match.from),
                                recipient: JSON.stringify(match.to)
                            },
                            pushTokens: pushTokensFrom
                        })
                            .then((r) => {
                                console.log(r.data)
                            })
                            .catch((error) => {
                                const { data, message } = error;
                                res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
                            })


                    }
                } catch (error) {
                    const { data, message } = error;
                    res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
                }



            },
        },
        {
            path: '/handleReject',
            method: 'post',
            handler: async (req, res, next) => {
                try {
                    const { from, to } = req.body;

                    if (!from || !to) {
                        return res.status(400).json({ error: 'Missing required parameter: from or to' })
                    }

                    const findMatches = await req.payload.find({
                        collection: 'matches',
                        where: {
                            from: {
                                equals: from
                            },
                            to: {
                                equals: to
                            },
                            status: {
                                equals: "REJECT"
                            },
                        },
                    })

                    if (findMatches.docs.length === 0) {
                        const newMatch = await req.payload.create({
                            collection: 'matches',
                            data: {
                                from: from,
                                to: to,
                                status: "REJECT",
                                isShow: false
                            },
                        })
                    }

                    res.status(200).send('ok')
                } catch (error) {
                    const { data, message } = error;
                    res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
                }
            },
        },
        {
            path: '/getMatches',
            method: 'post',
            handler: async (req, res, next) => {
                const { userId } = req.body;
                try {

                    if (!userId) {
                        return res.status(400).json({ error: 'Missing required parameter: userId' })
                    }

                    const { docs } = await req.payload.find({
                        collection: 'matches',
                        where: {
                            to: {
                                equals: userId
                            },
                            isShow: {
                                equals: false
                            },
                            status: {
                                equals: "LIKE"
                            }
                        }
                    })

                    let users = [];

                    for (const doc of docs) {
                        const user = await req.payload.findByID({
                            collection: "users",
                            id: (doc.from as any).id,
                            depth: 4
                        })

                        users.push(user)
                    }

                    res.status(200).send(users)
                } catch (error) {
                    const { data, message } = error;
                    res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
                }
            },
        },
    ],
}

export default Matches;