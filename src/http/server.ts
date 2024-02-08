import fastify from 'fastify';
import cookie from '@fastify/cookie'
import  websocket  from '@fastify/websocket';
import { createPolls } from '../routes/create-polls';
import { getPolls } from '../routes/get-polls';
import { voteOnPoll } from '../routes/vote-on-poll';
import { pollResults } from './ws/poll-results';

const app = fastify();

app.register(cookie, {
    secret: "poll-NLW", // for cookies signature
    hook: 'onRequest', // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
})

app.register(websocket)

app.register(createPolls);
app.register(getPolls);
app.register(voteOnPoll);
app.register(pollResults);


app.listen({port: 3333}).then(() => {
    console.log('HTTP server running!')
});