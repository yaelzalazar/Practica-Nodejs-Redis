const express = require("express");
const axios = require("axios");
const { createClient } = require("redis");
const responseTime = require("response-time");

const app = express();

//Conectado a redis
const client = createClient({
  host: "127.0.0.1",
  port: 6379,
});

app.use(responseTime());

//Obtener todos los personajes
app.get("/character", async (req, res, next) => {
  try {
    // Buscar datos de redis
    const reply = await client.get("character");

    // si existe regresa de redis y termina con la respuesta
    if (reply) return res.send(JSON.parse(reply));

    // Obtener datos de la API de Rick y Morty
    const response = await axios.get(
      "https://rickandmortyapi.com/api/character"
    );

    // Guardando los resultados en Redis. El "EX" y el 10, establece una caducidad de 10 Segundos
    const saveResult = await client.set(
      "character",
      JSON.stringify(response.data),
      {
        EX: 10,
      }
    );
    console.log(saveResult)

    // Responder al cliente
    res.send(response.data);
  } catch (error) {
    res.send(error.message);
  }
});

// Get a single character
app.get("/character/:id", async (req, res, next) => {
  try {
    const reply = await client.get(req.params.id);

    if (reply) {
      console.log("using cached data");
      return res.send(JSON.parse(reply));
    }

    const response = await axios.get(
      "https://rickandmortyapi.com/api/character/" + req.params.id
    );
    const saveResult = await client.set(
      req.params.id,
      JSON.stringify(response.data),
      {
        EX: 15,
      }
    );

    console.log("saved data:", saveResult);

    res.send(response.data);
  } catch (error) {
    console.log(error);
    res.send(error.message);
  }
});

async function main() {
  await client.connect();
  app.listen(3000);
  console.log("server listen on port 3000");
}

main();