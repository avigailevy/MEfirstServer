const jwt = require("jsonwebtoken");
const secretKey =
  process.env.JWT_SECRET || "Naomie&Perel@Schedule_project.2715.2969";
const genericServices = require('../Services/genericServices');

function verifyToken(req, res, next) {
  console.log("i am in verifyToken");
  // console.log(req.headers["authorization"]);
  
  const token = req.headers["authorization"] ? req.headers["authorization"].replace("Bearer ", "") : null;

  console.log("authHeader", token);

  if (!token) {
    console.log("if (!token) ");
    return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.log("jwt.verify ok");

      return res.status(401).json({ message: "Failed to authenticate token" });
    }
    console.log("decoded.userId", decoded.userId);
    console.log("decoded.role", decoded.role);
    req.userId = decoded.userId; // הוספת user לבקשה
    req.role = decoded.role; // הוספת user לבקשה
    next(); // מעבר לשלב הבא אם ה-token תקף
  });
}



const checkPermissions = (allowedRoles, action) => {
  return (req, res, next) => {
    console.log("checkPermissions", req.role);

    const userRole = req.role;
    // בדוק אם המשתמש יש לו את התפקיד הנדרש
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    // אם המשתמש הוא מורה, בדוק האם הוא יכול לגשת לנתונים שקשורים רק אליו

    if (userRole === "Teacher" && action === "read") {
      //לביננתיים זה נכון אך בהמשך מורה תוכל
      console.log("teacher want to read  the employee with id: ", req.query.id);
      req.query.id = req.userId; ///לבדוק שהוא באמת מתעדכן
    }

    if (userRole === "Teacher" && action === "update") {
      // בדוק אם המשתמש מנסה לעדכן נתונים של עצמו בלבד
      console.log(
        "teacher want to update her details: ",
        req.body.employeeToUpdate.ID
      );
      const employeeId = req.body.employeeToUpdate.ID;
      if (employeeId !== req.userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized to update this employee" });
      }
    }

    next();
  };
};

// Middleware to check if the user is the owner of the project or admin
async function authorizeProjectOwnerOrAdmin(req, res, next) {
    try {
        const userId = req.userId;
        const userRole = req.role;
        const projectId = req.params.projectId;

        // אם המשתמש אדמין - אפשר לעבור
        if (userRole === 'Admin') {
            return next();
        }

        // שלוף את הפרויקט
        const project = await genericServices.getRecordByColumn('projects', 'project_id', projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        // בדוק אם המשתמש הוא הבעלים של הפרויקט
        if (project.owner_user_id !== userId) {
            return res.status(403).json({ error: 'You are not authorized to access this project.' });
        }

        next();
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
}

module.exports = { verifyToken, checkPermissions, authorizeProjectOwnerOrAdmin };
