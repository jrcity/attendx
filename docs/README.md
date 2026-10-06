# AttendX - Smart Attendance Management System

## Overview
AttendX is a standalone, hardware-based attendance system designed to manage Check-In and Check-Out activities[cite: 1]. It provides two authentication options: fingerprint recognition as the primary method, and PIN entry as a fallback when fingerprint recognition fails[cite: 1]. To ensure accountability, the system automatically captures the individual's image whenever PIN-based authentication is used[cite: 1].

## Key Features
* **Dual Authentication:** Supports both fingerprint and PIN authentication to successfully identify registered users[cite: 1].
* **Automated Image Capture:** Captures and associates an image with the correct attendance event during PIN-based entry using an ESP-CAM[cite: 1].
* **Time & Role Management:** Automatically tracks "On Time" and "Late" status for arrivals after 9:00 AM, and classifies users by Staff or Student roles[cite: 1].
* **Offline Resilience:** Stores attendance events locally during temporary Wi-Fi network outages and automatically synchronizes them when the connection is restored[cite: 1].
* **Duplicate Prevention:** Actively validates the user's attendance state to reject duplicate Check-In attempts[cite: 1].
* **Centralized Dashboard:** Connects to a central web backend and database for managing users, monitoring attendance history, and exporting Excel reports[cite: 1].
* **Secure Registration:** Administrators manage users and fingerprints through a protected registration mode on the terminal[cite: 1].

## Hardware Architecture
The system is built around the following embedded components[cite: 1]:
* **Main Controller:** ESP32 Development Board[cite: 1].
* **Biometric Input:** SMF V1.7 fingerprint sensor[cite: 1].
* **Visual Input:** ESP-CAM[cite: 1].
* **Display:** 20x4 LCD for status feedback and clear instructions[cite: 1].
* **Manual Input:** 4x4 keypad for mode selection and ID entry[cite: 1].
* **Power Supply:** Dual-power management utilizing a primary DC adapter and a backup battery[cite: 1].

## How It Works
1. **Mode Selection:** Users select Check-In, Check-Out, or Registration via the keypad[cite: 1].
2. **Authentication:** The user authenticates using a registered fingerprint or PIN[cite: 1].
3. **Validation:** The ESP32 controller verifies the state logic to allow the transaction or reject duplicates[cite: 1].
4. **Recording:** The transaction and timestamp are recorded, and the outcome is displayed on the LCD[cite: 1].
5. **Data Transfer:** The event is sent over Wi-Fi to the central database, or stored in local memory if the terminal is offline[cite: 1].

## Project Information
* **Project Name:** AttendX[cite: 1].
* **Developed By:** Team RAMP[cite: 1].
* **Organization:** Nascomsoft Embeded Ltd.[cite: 1].
* **Date:** September 2026[cite: 1].
