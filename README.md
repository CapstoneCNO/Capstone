# Capstone - SEG4910[W] Software Engineering Project*

## Project Title
**Optimizing Radiation Therapy Using Visual Language Models (VLMs): Enhancing Precision and Usability**

## Overview
This capstone project aims to develop both a desktop and web-based software platform that enhances precision and efficiency in radiation therapy (and Extracardiac Findings if data available). By integrating advanced Visual Language Models (VLM) — specifically, improved Deep Learning models such as UNET and Cascade — the platform optimizes radiation dose delivery to effectively target cancerous tissues while minimizing harm to healthy tissues. The solution includes real-time clinician support, activity tracking, and robust uncertainty estimation to improve treatment outcomes and continuously refine the system. Designed as a user-friendly application, it provides essential tools for treatment planning, image review, and data visualization, ensuring accessibility and reliability for clinics with limited internet connectivity. Through clinical validation, user training, and interdisciplinary collaboration, this project seeks to advance oncology practices and improve patient care.

The application below serves as our Proof of Concept (PoC), which integrates the landing page with the patients section. Clinicians can add a patient and interact with a chatbot to upload the patient's scans and predict a dose. Accessing patient history is also available now, and the system will launch previous predictions instead of running the model again.

## Prerequisites
Before you begin, ensure you have the following software installed globally:
- **Node.js** - [Download Node.js](https://nodejs.org/)
- **npm** (Comes with Node.js)
- **Electron** - Run `npm install -g electron`
- **React** - Note: Typically, React is installed locally per project, but if needed globally, run `npm install -g react`
- **Vite** - Run `npm install -g vite`
