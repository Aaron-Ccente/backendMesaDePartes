import cors from 'cors'
import express from 'express'
import { PORT } from './src/config/config.js';

const app = express();
app.use(cors())
app.use(express.json())

app.get("/", (_,res)=>{
    res.status(200).json({success: true, message: "Servidor funcionando uwu"})
})

app.listen(PORT, ()=>{
    console.log("Servidor corriendo en el puerto: ", PORT)
})