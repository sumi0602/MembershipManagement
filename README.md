# 🧩 Membership Management System

A full-featured Node.js-based backend system for managing members, events, payments, attendance, and reports — built as part of a backend development project.

---

## 🚀 Features

- ✅ Member registration and profile management
- ✅ QR code generation for members
- ✅ Event creation and listing
- ✅ Event payment processing (Razorpay)
- ✅ Attendance tracking per event
- ✅ Receipt and payment record storage
- ✅ Membership renewal support
- ✅ Admin and role-based access (planned)
- ✅ Full API documentation (Swagger)

---

## 🛠️ Tech Stack

| Layer        | Technology           |
|--------------|----------------------|
| Backend      | Node.js, Express.js  |
| Database     | MongoDB + Mongoose   |
| Auth         | JWT-based Auth       |
| Payments     | Razorpay Integration |
| Docs         | Swagger / OpenAPI    |
| QR Code      | `qrcode` NPM package |

---

## 📦 Installation & Setup

```bash
# 1. Clone the repo
git clone https://github.com/sumi0602/MembershipManagement.git
cd MembershipManagement

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in MongoDB URI, JWT secret, Razorpay keys, etc.

# 4. Run the server
npm start


## 📬 Postman Collection

You can test the API using the Postman collection included here:  
👉 [Download Collection](./postman/MembershipManagement.postman_collection.json)

To use:
1. Open Postman
2. Click "Import"
3. Select this file
