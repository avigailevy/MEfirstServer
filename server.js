require("dotenv").config();
const express = require("express");
const app = express();
const { google } = require('googleapis');
const auth = require('./Services/googleServices/googleAuth');
const cors = require('cors');
app.use(cors());

app.use(express.json()); // מאפשר שליחת JSON בבקשות

// נתיבים
app.use("/:username/users", require("./API/usersRoutes"));
app.use("/:username/customers", require("./API/contactsRoutes"));
app.use("/:username/contacts/:customersOrSuppliers", require("./API/contactsRoutes"));
app.use("/:username/project/:project_id/criteria", require("./API/criteriaRoutes"));
app.use("/:username/documents", require("./API/documentsRoutes"));
app.use("/originalDocs", require("./API/originalDocsRoutes"));
app.use("/:username/passwords", require("./API/passwordsRoutes"));
app.use("/:username/products", require("./API/productsRoutes"));
app.use("/:username/products/:productId", require("./API/productsRoutes"));

app.use("/:username/projects/:projectStatus", require("./API/projectsRoutes"));
app.use("/:username/stages", require("./API/stagesRoutes"));
app.use("/:username/:project_id/summaries", require("./API/summariesRoutes"));
app.use("/:username/todos", require("./API/todosRoutes"));
app.use("/login", require("./API/loginRoutes"));
app.use("/:username/register", require("./API/registerRoutes"));

// בדיקת תקינות השרת
app.get("/", (req, res) => {
  return res.status(200).json("MEfirst server");
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
