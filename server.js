require("dotenv").config();
const express = require("express");
const app = express();


app.use(express.json()); // מאפשר שליחת JSON בבקשות

// נתיבים
app.use("/users", require("./API/usersRoutes"));
app.use("/contacts", require("./API/contactsRoutes"));
app.use("/criteria", require("./API/criteriaRoutes"));
app.use("/documents", require("./API/documentsRoutes"));
app.use("/generic", require("./API/genericRouter"));
app.use("/originalDocs", require("./API/originalDocsRoutes"));
app.use("/passwords", require("./API/passwordsRoutes"));
app.use("/products", require("./API/productsRoutes"));
app.use("", require("./API/projectsRoutes"));
app.use("/stages", require("./API/stagesRoutes"));
app.use("/summaries", require("./API/summariesRoutes"));
app.use("/todos", require("./API/todosRoutes"));

// בדיקת תקינות השרת
app.get("/", (req, res) => {
  return res.status(200).json("MEfirst server");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
