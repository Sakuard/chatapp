# React-Native Expo with Express.js Chat App Development Progress

## `app.json` Configuration Details

### `eas` Section

- **`projectId` in `eas`**
  - **Description**: The `projectId` is a unique identifier for your project on Expo Application Services (EAS). It links your local project with the Expo cloud services.
  - **Steps to Obtain and Set `projectId`**:
    1. **Register on Expo.dev**: Visit [Expo Developer Portal](https://expo.dev/) and create an account.
    2. **Create/Select a Project**: Once logged in, create a new project or select an existing one.
    3. **Find `projectId`**: In the project settings on the Expo Developer Portal, locate the `projectId`.
    4. **Update `app.json`**: Copy the `projectId` from the portal and paste it into your `app.json` file, replacing the existing empty string.

    ```json
    {
      ...
      "eas": {
        "projectId": "your-projectId-here"
      }
      ...
    }
    ```

  - **Note**: After updating the `projectId`, restart your Expo application to ensure the changes take effect.

## React-Native Expo (RN Expo)
- ✅ **Start Page**
  - Description: Page containing only one button "開始聊天" (Start Chat).
- ✅ **Chat Message Page**
  - Description: Page with a text box, a button, and a chat dialogue area.
  - Layout: Chat dialogue box at the top, followed by text box/button.
- ✅ **WebSocket Connection and Communication Functions**
- 🔘 **Implement SSL for WebSocket Protection**

## Express.js
- ✅ **WebSocket Server Implementation**
- ✅ **Define Communication Functions**
- ✅ **Random Pairing Mechanism Setup**
- 🔘 **Implement SSL for WebSocket Protection**

Status Legend:
- ✅ Completed
- ❌ Not Started
- 🔘 Partially Completed
