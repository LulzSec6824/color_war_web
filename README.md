# 🎨 Color War - A Cross-Platform Mobile Game 🎮

[![Netlify Status](https://api.netlify.com/api/v1/badges/35808974-bb78-41a1-92a6-3bfbf6f246de/deploy-status)](https://app.netlify.com/projects/wasmrust/deploys)

## 🌟 Overview

This is a web-based, cross-platform mobile game for Android and iOS, built with interactive gameplay. The game is developed using HTML, CSS, and vanilla JavaScript, making it lightweight and easy to package for mobile platforms using tools like Cordova or Capacitor.

## 🚀 Game Features

- **Cross-Platform**: Play on any device with a modern web browser, or package it as a native app for Android and iOS.
- **Multiplayer Support**: Supports up to 4 players on the same device.
- **Interactive Gameplay**: Engage in a dynamic and strategic battle for board dominance.
- **Visually Engaging Animations**: Smooth animations for circle division and other game events.
- **Sequential Division**: Trigger cascading chain reactions to take over the board.

## 📜 Game Rules

### 🛠️ Game Setup & Core Mechanics

1. **Initial Placement**: At the start of the game, each player selects a designated "box" on the 8x10 game board. The initial circle placed in this box will begin with 3 "power" (pow).
2. **Circle Division**: When a circle accumulates 4 power, it divides into 4 new circles, each with 1 power. The original box from which the division occurred will become empty.
3. **Division Animation**: A visually engaging animation shows the new circles emanating from the main circle, moving simultaneously in up, down, left, and right directions.
4. **Placement Restriction**: After the initial circle selection phase, players are prohibited from placing new circles in any empty box.
5. **Circle Conversion**: If a player's circle is hit by an opponent's circle, it converts to the opponent's color. If the converted circle has 3 power, it immediately divides according to the opponent's circle division logic.
6. **Power Increment**: Players can only interact with and add 1 power to circles that match their designated color. Once a player's colored circle reaches 4 power, it must follow the division rules.
7. **Sequential Division**: A sequential division mechanism is implemented. After an initial circle divides, any adjacent circles that subsequently reach 4 power will divide in a cascading sequence.

### 🏆 Winning

- A player is eliminated when they have no circles left on the board.
- The last player with circles on the board wins the game.

## 🖥️ User Interface & Experience

- **Turn Indicator**: The current player's turn is clearly displayed.
- **Turn End Notification**: A clear notification and visual cue indicates when a player's turn has ended.

## 🎛️ Controls

- **Mouse/Touch**: Click or tap on a cell to perform an action.

## 📥 Running the Game

To run the game locally, you need to serve the files using a local web server.

1. Clone or download the repository.
2. Navigate to the `color_war_web` directory in your terminal.

3. Start a simple Python HTTP server:

    ```sh
    python -m http.server
    ```

4. Open your web browser and go to `http://localhost:8000`.

## 📱 Cross-Platform Deployment

To package this web application as a native mobile app for Android and iOS, you can use a wrapper like [Apache Cordova](https://cordova.apache.org/) or [Capacitor](https://capacitorjs.com/).

### Example with Capacitor

1. **Install Capacitor**:

    ```sh
    npm install @capacitor/core @capacitor/cli
    ```

2. **Initialize Capacitor**:

    ```sh
    npx cap init "Color War" "com.example.colorwar" --web-dir "public"
    ```

3. **Add Mobile Platforms**:

    ```sh
    npx cap add android
    npx cap add ios
    ```

4. **Sync and Build**:

    ```sh
    npx cap sync
    npx cap open android
    npx cap open ios
    ```

    This will open the native projects in Android Studio and Xcode, where you can build and run the app on emulators or physical devices.
