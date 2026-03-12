import dotenv from "dotenv"
dotenv.config()
interface Env {
    PORT: number
    HOST: string
    JWT_SECRET: string
    NODE_ENV: string
    JWT_EXPIRE: string
    BCRYPT_ROUNDS: number
    CORS_ORIGIN: string
}

const env:Env ={
    PORT: Number(process.env.PORT) || 5000,
    HOST: process.env.HOST|| "",
    JWT_SECRET: process.env.JWT_SECRET || "",
    NODE_ENV: process.env.NODE_ENV || "",
    JWT_EXPIRE: process.env.JWT_EXPIRE || "",
    BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS),
    CORS_ORIGIN: process.env.CORS_ORIGIN || ""

}

export default env