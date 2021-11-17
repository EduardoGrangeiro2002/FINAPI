const { request, response } = require('express');
const express = require('express');

const app = express()

const { v4:uuidv4 } = require('uuid');

const costumers = [];

const PORT = 3333;

app.use(express.json());

/**
 * cpf - string
 * name- string
 * id - uuid
 * statement - []
 */


function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;
    const costumer = costumers.find((costumer) => costumer.cpf === cpf);

    if(!costumer){
        return response.status(400).json({error: "Costumer not found,"})
    }

    request.costumer = costumer;

   return next();
}

function getBalance(statement){
  const balance = statement.reduce((acc, operation) =>{
     if(operation.type === 'credit'){
         return acc + operation.amount
     }else {
         return acc - operation.amount
     }
    
},0)
   return balance;
}




app.post('/account',  (request, response) =>{
    const {cpf, name} = request.body;
    const costumersAlreadyExists = costumers.some(
        (costumer)=> costumer.cpf === cpf
    );

    if(costumersAlreadyExists){
        response.status(400).json({error: 'Costumer already exist'})
    }
 
    costumers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    });

    response.status(201).send()

})

app.get('/statement', verifyIfExistsAccountCPF, (request, response) =>{
   
    const { costumer } = request;
   
    return response.json(costumer.statement)

})


app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
    
    const { description, amount } = request.body;

    const { costumer } = request;

    const statementOperation = {
        description,
        amount,
        create_at: new Date(),
        type: 'credit'
    }

    costumer.statement.push(statementOperation);
     return   response.status(201).send()


}) 


app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) =>{

    const { amount } = request.body;
    const { costumer } = request;

    const balance = getBalance(costumer.statement);

    if(balance < amount){
     return  response.status(400).json({'error': "Insufficient funds"});

    }
    const statementOperation = {
        amount,
        create_at: new Date(),
        type: 'debit'
    }
     costumer.statement.push(statementOperation)
     return response.status(201).send()


})

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) =>{
   
    const { costumer } = request;

    const { date } = request.query;

    const newDateFormat = new Date( date + " 00:00");

    const extrato = costumer.statement.filter((statement) => statement.create_at.toDateString() === new Date(newDateFormat).toDateString())
   
    return response.json(extrato)

})

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
        const { name } = request.body;
        const { costumer } = request;
        costumer.name = name;
        response.status(201).send()
});

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {

    const { costumer } = request;

    response.status(200).json(costumer);

})

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { costumer } = request;

    costumers.splice(costumer, 1);

    return response.status(200).json(costumers);

})


app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
    const { costumer } = request;

    const balance = getBalance(costumer.statement);

    return response.status(200).json(balance);

})

app.listen(PORT, (err)=>{
    if(!err){
        console.log(`Servidor rodando na Porta:${PORT}`);
    }
})