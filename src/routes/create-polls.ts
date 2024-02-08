import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function createPolls(app: FastifyInstance){

    app.post("/polls", async (request, reply) => {
        const createPollBody = z.object({
            title: z.string(),
            options: z.array(z.string()),
        })
    
        const { title, options} = createPollBody.parse(request.body)
        //pega o request body e ve se esta no formato acima
    
        const poll = await prisma.poll.create({
            data: {
                title,
                options: {
                    createMany: {
                        data: options.map(option =>{
                            return { title: option}
                        })
                    }
                }
            }
        })
        
        return reply.status(201).send({ pollID: poll.id})
    })
}