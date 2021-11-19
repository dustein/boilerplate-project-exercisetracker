const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//MINHAS CONFIG

const mongoose = require('mongoose')
const mongodb = require('mongodb')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

//substitui BodyParser
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

const { Schema } = mongoose

const exercicioSchema = new Schema({
  description: String,
  duration: Number,
  date: String
})

const userSchema = new Schema({
  username: {type: String, required: true, unique:true},  
  log: [exercicioSchema]
})

const BancoExer = mongoose.model('BancoExer', exercicioSchema)
const BancoUser = mongoose.model('BancoUser', userSchema)


//----------------------------

//CRIA NOVO USUARIO ///////////////////
app.post(
  "/api/users",
  (req, res) => {
    let username = req.body.username
    let userID

    //GRAVA NO BANCO DE DADOS
let newUser = new BancoUser({
  username: username
})
newUser.save()
console.log("Salvo: " + newUser.id)
userID = newUser.id
  //---------------------
  res.json({
    username: username,
    _id: userID
  })
  }
)
//---------------------------------------


app.get(
  "/api/users",
  (req, res) => {
    //listar todos os usuarios
    BancoUser.find(
      {},
      (err, listagem) => {
        if(err) {
          console.log(err)
        } else {          
          res.json(listagem)
        }
      }
    )    
  }
)


//exibir usuario pelo ID (meu teste)
app.get("/api/users/:_id", (req, res)=> {
  let idUser = req.params._id
  BancoUser.find({_id: idUser},
  (erro, seleciona)=>{
    if(erro) {
      console.log(erro)
    }else{
      console.log("EXIBINDO: ")
      console.log(seleciona)
      res.json(seleciona)
    }
  })

  })



//insere informacoes de treino

app.post("/api/users/:_id/exercises",
 (req, res) => {

    let takedate = req.body.date
    if(takedate){
      date = new Date(takedate).toDateString()
    } else {
      date = new Date().toDateString()
    }

    let dataFormatada = date

    let novoExercicio = new BancoExer({
      description: req.body.description,
      duration: req.body.duration,
      date: dataFormatada
    })

    BancoUser.findByIdAndUpdate(
      req.params._id,
      {$push: {log: novoExercicio}},
      {new: true},
      (err, atualizaUser)=> {
        if (err) {
          console.log(err)
        } else {
          let resposta = {}
          resposta['username'] = atualizaUser.username
          resposta['description'] = novoExercicio.description
          resposta['duration'] = novoExercicio.duration
          resposta['date'] = novoExercicio.date
          resposta['_id'] = atualizaUser._id
          res.json(resposta)
        }
      }
    )


//minha primeira solução...
    // BancoUser.findOneAndUpdate({_id: req.params._id},
    // {description: req.body.description, duration: req.body.duration, date: date},
    // {new: true},
    // (err, adicionado) => {
    //   if(err){
    //     console.log(err)
    //   }else{
    //     console.log("- O K -")


    //     //resposta pro exercicio
    //     atualizado = {}
    //     atualizado['username'] = adicionado.username
    //     atualizado['description'] = adicionado.description
    //     atualizado['duration'] = adicionado.duration
    //     atualizado['date'] = (adicionado.date).toDateString()
    //     atualizado['_id'] = adicionado._id
    //     res.json(atualizado)
    //   }
    // })

})

//PESQUISA O LOG DE DACA ID//////////////////////////////
app.get("/api/users/:_id/logs",
  (req, res) => {
    
    BancoUser.findById(req.params._id,
      (err, selecionado)=> {
        if (err) {
          console.log(err)
        } else {
          let resposta = selecionado
          if(req.query.from || req.query.to){
            let fromDate = new Date(0)
            let toDate = new Date()

            if(req.query.from){
              fromDate = new Date(req.query.from)
            }
            if(req.query.to){
              toDate = new Date(req.query.to)
            }

            fromDate = fromDate.getTime()
            toDate = toDate.getTime()

            resposta.log = resposta.log.filter((exerc)=>{
              let dataExerc = new Date(exerc.date).getTime()

              return dataExerc >= fromDate && dataExerc <= toDate
            })
          }

          if(req.query.limit){
            resposta.log = resposta.log.slice(0, req.query.limit)
          }
//para exibir o count teve que passar primeiro para JSON
          resposta = resposta.toJSON()
          resposta['count'] = selecionado.log.length
          res.json(resposta)

        }
      }
    )




  }
)
//------------------------------------------------------


//update usando $set - nao funcionou para criar nova propriedade
    // BancoUser.update({_id: idAdd}, {$set: {novidade: "inovou"}}, (err, salva) => {
    //   if(err){
    //     console.log(err)
    //   }else{
    //     console.log("salvo")
    //   }
    // })

//---------------------------------------------------------------
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('SERVIDOR ATIVO NA PORTA ' + listener.address().port)
})
