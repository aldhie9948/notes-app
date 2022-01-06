require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Note = require("./models/note");

const requestLogger = (request, response, next) => {
  console.log(`Method:`, request.method);
  console.log(`Path:`, request.path);
  console.log(`Body:`, request.body);
  console.log(`---`);
  next();
};

const app = express();
app.use(express.static("build"));
app.use(express.json());
app.use(cors());
app.use(requestLogger);

app.get("/", (request, response) => {
  response.send(`<h1>Hello World</h1>`);
});

app.get("/api/notes", (request, response) => {
  Note.find({}).then((notes) => response.json(notes));
});

app.get("/api/notes/:id", (request, response, next) => {
  Note.findById(request.params.id)
    .then((note) => {
      note ? response.json(note) : response.status(404).end();
    })
    .catch((error) => next(error));
});

app.delete("/api/notes/:id", (request, response, next) => {
  Note.findByIdAndRemove(request.params.id)
    .then((result) => {
      result
        ? response.status(204).end()
        : response.status(404).send({ error: `note not found in database` });
    })
    .catch((error) => next(error));
});

app.post("/api/notes", (request, response, next) => {
  const body = request.body;

  const note = new Note({
    content: body.content,
    important: body.important || false,
    date: new Date(),
  });

  note
    .save()
    .then((savedNote) => savedNote.toJSON())
    .then((savedAndFormattedNote) => response.json(savedAndFormattedNote))
    .catch((error) => next(error));
});

app.put("/api/notes/:id", (request, response, next) => {
  const body = request.body;

  const note = {
    content: body.content,
    important: body.important,
  };

  Note.findByIdAndUpdate(request.params.id, note, { new: true })
    .then((updatedNote) => response.json(updatedNote))
    .catch((error) => next(error));
});

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

// handler semua request yang tidak ada
app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
  console.log(`error name :`, error.name, `error message: `, error.message);
  if (error.name === "CastError")
    return response.status(404).send({ error: "malformatted id" });
  if (error.name === "ValidationError")
    return response.status(400).json({ error: error.message });
  next(error);
};

// handler semua request yang error
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
