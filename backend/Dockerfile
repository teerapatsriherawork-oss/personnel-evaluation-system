# backend/Dockerfile

# ใช้ Node.js image
FROM node:18-alpine

# กำหนด Working Directory
WORKDIR /app

# Copy package.json และ install dependencies
COPY package*.json ./
RUN npm install

# Copy โค้ดทั้งหมด
COPY . .

# สร้างโฟลเดอร์ uploads รอไว้
RUN mkdir -p uploads

# เปิด Port 5000
EXPOSE 5000

# คำสั่งรัน Server
CMD ["npm", "start"]