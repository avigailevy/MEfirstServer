const jwt = require("jsonwebtoken");
const secretKey =
  process.env.JWT_SECRET || "Naomie&Perel@Schedule_project.2715.2969";
const genericServices = require('../Services/genericServices');


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // 'Bearer TOKEN'

    if (!token) return res.status(401).json({ message: "Access denied" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid token" });

        req.user = user; // שומר את המידע לצורך המשך טיפול
        next();
    });
}


function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role) {
      return res.status(401).json({ message: "Missing role in token" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Access denied: role not allowed" });
    }

    next();
  };
}
// // Middleware to check user permissions based on role
// const checkPermissions = (allowedRoles, action) => {
//   return (req, res, next) => {
//     console.log("checkPermissions", req.role);

//     const userRole = req.role;
//     // בדוק אם המשתמש יש לו את התפקיד הנדרש
//     if (!allowedRoles.includes(userRole)) {
//       return res.status(403).json({ error: "Unauthorized" });
//     }
//     // אם המשתמש הוא מורה, בדוק האם הוא יכול לגשת לנתונים שקשורים רק אליו

//     if (userRole === "Teacher" && action === "read") {
//       //לביננתיים זה נכון אך בהמשך מורה תוכל
//       console.log("teacher want to read  the employee with id: ", req.query.id);
//       req.query.id = req.userId; ///לבדוק שהוא באמת מתעדכן
//     }

//     if (userRole === "Teacher" && action === "update") {
//       // בדוק אם המשתמש מנסה לעדכן נתונים של עצמו בלבד
//       console.log(
//         "teacher want to update her details: ",
//         req.body.employeeToUpdate.ID
//       );
//       const employeeId = req.body.employeeToUpdate.ID;
//       if (employeeId !== req.userId) {
//         return res
//           .status(403)
//           .json({ error: "Unauthorized to update this employee" });
//       }
//     }

//     next();
//   };
// };

module.exports = { authenticateToken,authorizeRoles 
  // checkPermissions 
};
