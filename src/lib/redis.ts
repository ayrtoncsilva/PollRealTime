import { Redis } from "ioredis";

export const redis = new Redis();

export function zincrby(pollId: string, arg1: number, pollOptionId: string) {
    throw new Error('Function not implemented.');
}
