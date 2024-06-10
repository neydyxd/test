import { CollectionConfig } from 'payload/types'
import payload from 'payload'
import { generateVerificationCode } from '../utils/generateVerificationCode'

const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7776000,
  },
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name'
    },
    {
      name: 'coordinates',
      type: 'point',
      label: 'Coordinates'
    },
    {
      name: 'locationName',
      type: 'text',
      label: 'Location Name'
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'mediaAvatars',
      filterOptions: {
        mimeType: { contains: 'image' },
      },
    },
    {
      name: 'photos',
      type: 'relationship',
      relationTo: 'mediaAvatars',
      hasMany: true,
      filterOptions: {
        mimeType: { contains: 'image' },
      },
      label: "Photos"
    },
    {
      name: 'pushTokens',
      type: 'relationship',
      relationTo: 'pushTokens',
      hasMany: true,
      label: "Push Tokens"
    },
    {
      name: 'birth',
      type: 'date',
      label: 'BirthDate'
    },
    {
      name: 'about',
      type: 'text',
      label: 'About'
    },
    {
      name: 'chats',
      type: 'relationship',
      relationTo: 'chats',
      hasMany: true,
      label: 'Chats'
    },
    {
      name: 'gender',
      type: 'select',
      label: 'Gender',
      options: [
        {
          label: "Male",
          value: "MALE"
        },
        {
          label: "Female",
          value: "FEMALE"
        }
      ]
    },
    {
      name: 'lookingGender',
      type: 'select',
      label: 'Looking Gender',
      options: [
        {
          label: "Male",
          value: "MALE"
        },
        {
          label: "Female",
          value: "FEMALE"
        },
        {
          label: "Non Binary",
          value: "NON_BINARY"
        }
      ]
    },
    {
      name: 'passions',
      type: 'select',
      hasMany: true,
      label: 'Passions',
      options: [
        {
          label: "Art",
          value: "ART"
        },
        {
          label: "Extreme",
          value: "EXTREME"
        },
        {
          label: "Gym",
          value: "GYM"
        },
        {
          label: "Cinema",
          value: "CINEMA"
        },
        {
          label: "Cooking",
          value: "COOKING"
        },
        {
          label: "Games",
          value: "GAMES"
        },
        {
          label: "Parties",
          value: "PARTIES"
        },
        {
          label: "Music",
          value: "MUSIC"
        },
        {
          label: "Photograph",
          value: "PHOTOGRAPH"
        },
        {
          label: "Reading",
          value: "READING"
        },
        {
          label: "Run",
          value: "RUN"
        },
        {
          label: "Technology",
          value: "TECHNOLOGY"
        },
        {
          label: "Traveling",
          value: "TRAVELING"
        },
        {
          label: "Yoga",
          value: "YOGA"
        },
      ]
    },
    {
      name: 'phoneNumber',
      type: 'text',
      label: 'Phone Number'
    },
  ],
  endpoints: [
    {
      path: '/sendMessage',
      method: 'post',
      handler: async (req, res, next) => {
        const { phoneNumber } = req.body;
        try {
          if (!phoneNumber) {
            return res.status(400).json({ error: 'Missing required parameters' })
          }

          const user = await payload.find({
            collection: 'users',
            where: {
              email: {
                equals: phoneNumber + "@mail.ru"
              },
            }
          });

          if (user.docs.length !== 0) {
            var id;
            if (typeof user.docs[0].id === "string") {
              id = user.docs[0].id;
            }
            const messageCode = generateVerificationCode();
            const updatedUser = await payload.update({
              collection: 'users',
              id,
              data: {
                password: messageCode,
              }
            });
            fetch(`https://sms.ru/sms/send?api_id=7E0FBE78-AA59-8876-9E4C-A4904B014E50&to=${phoneNumber}&msg=Ваш+код:+${messageCode}&json=1`)
              .then(() => {
                res.status(200).json({ messageCode })
              })
              .catch((error) => {
                const { data, message } = error;
                res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
              })
          } else {
            const messageCode = generateVerificationCode();
            const newUser = await payload.create({
              collection: 'users',
              data: {
                email: phoneNumber + "@mail.ru",
                password: messageCode,
              }
            });
            fetch(`https://sms.ru/sms/send?api_id=7E0FBE78-AA59-8876-9E4C-A4904B014E50&to=${phoneNumber}&msg=Ваш+код:+${messageCode}&json=1`)
              .then(() => {
                res.status(200).json({ messageCode })
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
      path: '/customLogin',
      method: 'post',
      handler: async (req, res, next) => {
        const { phoneNumber, code } = req.body;
        try {
          if (!phoneNumber) {
            return res.status(400).json({ error: 'Missing required parameters' })
          }

          if (typeof phoneNumber === "string" && typeof code === "string") {
            const logginedUser = await payload.login({
              collection: 'users',
              data: {
                email: phoneNumber + '@mail.ru',
                password: code
              },
              depth: 4
            })
            res.status(200).json(logginedUser)

          }
        } catch (error) {
          const { data, message } = error;
          res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
        }
      },
    },
    {
      path: '/setAvatar',
      method: 'patch',
      handler: async (req, res, next) => {
        const files = req.files.file;
        const { userId } = req.body;

        try {

          if (!userId || !files) {
            return res.status(400).json({ error: 'Missing required parameter:userId or files' })
          }

          const newAvatar = await req.payload.create({
            collection: 'mediaAvatars',
            file: files,
            data: {}
          })

          const updatedUser = await req.payload.update({
            collection: 'users',
            id: userId,
            data: {
              avatar: newAvatar.id
            },
            depth: 4
          })

          res.status(200).send(updatedUser)
        } catch (error) {
          const { data, message } = error;
          res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
        }
      },
    },
    {
      path: '/setPhotos',
      method: 'patch',
      handler: async (req, res, next) => {
        const files = req.files.file;
        const { userId } = req.body;

        try {

          if (!userId || !files) {
            return res.status(400).json({ error: 'Missing required parameter:userId or files' })
          }

          if (files.length > 5) {
            res.status(500).send("There can be no more than 5 photos")
          }

          const user = await req.payload.findByID({
            collection: 'users',
            id: userId,
            depth: 4
          })

          const userPhotos = user.photos
          let oldMediaIds = [];
          if (userPhotos instanceof Array) {
            for (const userPhoto of userPhotos) {
              oldMediaIds.push(userPhoto.id)
            }
          }

          let newMediaIds = [];
          
          let filesArray:any;
          if (files.length > 1) {
            filesArray = files;
          } else {
            filesArray = [files];
          }
          for (const file of filesArray) {
            const newMedia = await req.payload.create({
              collection: 'mediaAvatars',
              file: file,
              data: {}
            })

            newMediaIds.push(newMedia.id);
          }

          const difference = newMediaIds.length + oldMediaIds.length - 5;
          let differenceMap = [];
          let resultOldMediaIds = [];
          let resultMediaIds = []

          if (difference > 0) {
            differenceMap = oldMediaIds.slice(-difference)
            resultOldMediaIds = oldMediaIds.slice(0, -difference);
            resultMediaIds = newMediaIds.concat(resultOldMediaIds)
          } else {
            resultMediaIds = newMediaIds.concat(oldMediaIds)
          }
          
          for (const object of differenceMap) {
            const deletedPhotos = req.payload.delete({
              collection: 'mediaAvatars',
              id: object
            })
          }


          const updatedUser = await req.payload.update({
            collection: "users",
            id: userId,
            data: {
              photos: resultMediaIds
            },
            depth: 4
          })

          res.status(200).send(updatedUser)
        } catch (error) {
          const { data, message } = error;
          res.status(error.status).json({ errors: [{ name: error.name, data, message }] })
        }
      },
    },
    {
      path: '/deletePhoto',
      method: 'delete',
      handler: async (req, res, next) => {
        try {
          const { userId, photoId } = req.body

          if (!userId || !photoId) {
            res.status(500).json({ error: 'Missing required parameter:userId or photoId' })
          }

          const user = await req.payload.findByID({
            collection: "users",
            id: userId,
            depth: 4
          })

          const userPhotos = user.photos as any[]
          let userPhotosIds = [];

          for (const userPhoto of userPhotos) {
            userPhotosIds.push(userPhoto.id)
          }

          const resultPhotoIds = userPhotosIds.filter(el => el !== photoId)

          const updatedUser = await req.payload.update({
            collection: "users",
            id: userId,
            data: {
              photos:resultPhotoIds
            }
          })

          const deletedPhoto = await req.payload.delete({
            collection: "mediaAvatars",
            id: photoId
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

export default Users
