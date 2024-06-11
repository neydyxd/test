import path from 'path'

import { payloadCloud } from '@payloadcms/plugin-cloud'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'
import { buildConfig } from 'payload/config'

import Users from './collections/Users'
import Messages from './collections/Messages'
import Matches from './collections/Matches'
import Chats from './collections/Chats'
import MediaAvatars from './collections/MediaAvatars'
import MediaChats from './collections/MediaChats'
import pushTokens from './collections/pushTokens'

export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),

  },
  editor: slateEditor({}),
  collections: [Users, Messages, Matches, Chats,MediaAvatars, MediaChats, pushTokens],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  rateLimit: {
    trustProxy: true,
  },
  csrf: [
    'http://localhost:3000',
    'https://matchy-payload-dev.payloadcms.app',
    'http://90.156.217.248:3000'
  ],
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  plugins: [payloadCloud()],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
})
