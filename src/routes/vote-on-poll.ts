import { z } from 'zod';
import {randomUUID} from "node:crypto"
import { prisma } from '../lib/prisma';
import { FastifyInstance } from 'fastify';
import { redis } from '../lib/redis';
import { voting } from '../utils/voting-pub-sub';

export async function voteOnPoll(app: FastifyInstance) {
    
    app.post('/polls/:pollId/votes', async (request, reply) => {
        
        // Coletar corpo e parametros do request
        const voteOnPollBody = z.object({
            pollOptionId: z.string().uuid(),
        })
        
        const voteOnPollParams = z.object({
            pollId: z.string().uuid(),
        })

        const { pollOptionId } = voteOnPollBody.parse(request.body)
        const { pollId } = voteOnPollParams.parse(request.params)

        let { sessionId } = request.cookies

        // Ja acessou
        if(sessionId){
            const userPreviousVoteOnPoll = await prisma.vote.findUnique({
                where: {
                    sessionId_pollId: {
                        sessionId,
                        pollId,
                    },
                }
            })

            if(userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId != pollOptionId) {
                // Apagar voto anterior
                await prisma.vote.delete({
                    where: {
                        id: userPreviousVoteOnPoll.id,
                    },
                })
                // Decrementar contagem no Redis
                const votes = await redis.zincrby(pollId, -1, userPreviousVoteOnPoll.pollOptionId)

                voting.publish(pollId, {
                    pollOptionId: userPreviousVoteOnPoll.pollOptionId,
                    votes: Number(votes),
                })

            } else if(userPreviousVoteOnPoll){
                // Ja votou na mesma opção
                return reply.status(400).send({message: 'You already voted on this poll.'})
            }
        }

        // Nunca acessou
        if(!sessionId) {
            // Setar cookie para verificação do voto
            sessionId = randomUUID()
            reply.setCookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 30, // 30 days,
                signed: true,
                httpOnly: true,
            })
        }
        
        // Criação do voto
        await prisma.vote.create({
            data: {
                sessionId,
                pollId,
                pollOptionId,
            }
        })

        const votes = await redis.zincrby(pollId, 1, pollOptionId)

        voting.publish(pollId, {
            pollOptionId,
            votes: Number(votes),
        })

        return reply.status(201).send()
    })
}