# MSAL-Node Authentication Code Flow

This document explains how to implement the Authorization Code Flow using MSAL-Node. It includes setup instructions, descriptions of key functions, and an overview of the routes used in the authentication process.

## Table of Contents

- [Introduction](#introduction)
- [API Documentation](#api-documentation)
- [Prerequisites](#prerequisites)
- [Installation and Configuration](#installation-and-configuration)
- [Key Functions](#key-functions)
- [Middlewares](#middlewares)
- [Routes](#routes)
- [Utils](#utils)
- [Conclusion](#conclusion)

## Introduction

The Microsoft Authentication Library (MSAL) for Node.js enables applications to authenticate users and acquire tokens to access protected resources. This guide demonstrates the implementation of the Authorization Code Flow using MSAL-Node.

## API Documentation

**Express endpoints**

| Method | Endpoint           | Description                                |
| ------ | ------------------ | ------------------------------------------ |
| `GET`  | `/auth/signin`     | Sign in the user.                          |
| `POST` | `/auth/redirect`   | Handle redirect from microsoft.            |
| `GET`  | `/auth/signout`    | Sign out a user.                           |
| `GET`  | `/users/profile`   | Get user profile using Graph API.          |
| `POST` | `/users/authorize` | Authorize users based on groups and roles. |
| `POST` | `/users/invite`    | Invite Guest users to directory.           |

## Prerequisites

- Node.js installed
- Azure subscription
- Registered application in Azure Entra ID

## Installation and Configuration

### Install the required packages:

Run the command:

```bash
npm install
```

### Create .env file for configuration:

Create a .env file in the server folder and add the following:

```bash
CLIENT_ID=<Application-ID>
CLIENT_SECRET=<Client-Secret>
TENANT_ID=<Tenant-ID>
REDIRECT_URI=<Server_Base_URL/redirect>
REDIS_HOST=<HostAddr-For-Redis>
REDIS_PORT=<Redis-Port>
POST_LOGOUT_REDIRECT_URI=<Client_Base_URL
GRAPH_API_ENDPOINT="https://graph.microsoft.com/" # graph api endpoint string should end with a trailing slash
CLIENT_REDIRECT_URI=<Client_Base_URL/profile>
EXPRESS_SESSION_SECRET=<Express-Session-Secret>
GRAPH_INVITE_ENDPOINT="https://graph.microsoft.com/v1.0/invitations"
SCOPES=<Scopes>
REQUIRED_GROUPS_TO_INVITE=<Groups-separated-by-comma>
REQUIRED_ROLES_TO_INVITE=<Roles-separated-by-comma>
NODE_ENV=<"dev"> #set to "production" for cookie to be sent over https
```

### Run the server:

Run the server:

```bash
npm start
```

## Configurations

1. **authConfig.js** : Configures all the env variables from .env and exports them.
2. **msalConfig.js** : Configures MSAL and also configures the cache for msal using redis. Exports the msal instance and the cryptoProvider instance.

## Key Functions

### Get Authorization Code URL

**Overview**:
This function generates the URL for the authorization code request. It ensures that necessary metadata is fetched and generates PKCE codes for enhanced security. The generated URL is then used to redirect the user to the Microsoft login page.

**Request**:
Parameters include scopes, redirect URI, code challenge, and response mode.

**Response**:
Returns the authorization code URL.

### Handle Redirect and Exchange Token

**Overview**:
This function handles the redirect from Azure AD after the user has authenticated. It exchanges the authorization code received in the redirect request for an access token. The function also verifies the PKCE code challenge.

**Request**:
Parameters include the authorization code, scopes, redirect URI, and code verifier.

**Response**:
Returns the acquired access token and other related authentication information and stored thes authentication information in session storage.

**Explanation**:

**_acquireTokenByCode_**: This method is part of the MSAL confidential client application. It is used to exchange an authorization code for an access token. This access token is then used to access protected resources.

### Get User Profile

**Overview**:
This function fetches the user's profile information from Microsoft Graph API using the acquired access token. It retrieves details such as user ID, email, display name, groups, and roles.

**Request**:
The access token is included in the request header to authenticate the call to Microsoft Graph API.

**Response**:
Returns the user's profile information, including ID, email, user principal name, display name, groups, and roles.

### Logout

**Overview**:
This function logs the user out by revoking their sessions on Microsoft Graph API and removing their account from the MSAL cache. It also destroys the session on the application server and generates a logout URL.

**Request**:
The access token is included in the request header to authenticate the call to revoke sessions.

**Response**:
Returns the logout URL to redirect the user to the Azure AD logout page.

### Invite:

**Overview**:
This function invites a user to join the organization. It sends an email invitation to the specified user with a message.

**Request**:
Parameters include invitedUserEmailAddress,inviteRedirectUrl,sendInvitationMessage(boolean) and the Group ID of the Group to be added into.

**Response**:
Returns the invitation status.

### Authorize:

**Overview**:
This method is used to authorize the signed-in user to access the resource.It compares the required groups and roles with the users groups and roles from graph api. If the user has at least one Group and Role from the required, the user is Authorized.

**Request**:
Parameters include the required groups and roles from request body.

**Response**:
Returns true if the user is authorized, false otherwise.

## Middlewares:

### acquireTokenSilent Middleware:

**Overview**:
This method acquires a token silently when the user is already signed in and the token is cached. If the token is expired or not available, it will use the refresh token to acquire a new token.

**Request**:
Parameters include the account information.

**Response**:
Stores the Acquired tokens in Session storage.

**Explanation**:

**_acquireTokenSilent_**: This method is part of the MSAL confidential client application. It is used to silently acquire a token for a given set of scopes without prompting the user. It first checks if there is a valid token in the cache. If not, it uses the refresh token to acquire a new token.

### authMiddleware:

**Overview**:
This middleware checks if the user is signed in or not. It checks the session storage for user's auth information.

**Request**:
Parameters include the req.

**Response**:
If User is signed in the next() is called, else 401 error with Unauthorized message is sent.

## Routes

**Overview**:
The following routes handle the authentication and user information retrieval processes:

### `/auth/signin`:

- **Description**: Initiates the sign-in process by generating the authorization code URL.
- **HTTP Method**: GET
- **Controller Method**: `authController.getAuthCodeUrl`

### `/auth/redirect`:

- **Description**: Handles the redirect and exchanges the authorization code for an access token.
- **HTTP Method**: POST
- **Controller Method**: `authController.acquireTokenByCode`

### `/auth/signout`:

- **Description**: Logs the user out by revoking their sessions and removing their account from the cache.
- **HTTP Method**: GET
- **Controller Method**: `authController.logout`

### `/users/profile`:

- **Description**: Retrieves the authenticated user's profile information.
- **HTTP Method**: GET
- **Middleware**: `authMiddleware`, `acquireTokenSilent`
- **Controller Method**: `authController.getUserProfile`

### `/users/authorize`:

- **Description**: Authorizes user based on his groups and roles.
- **HTTP Method**: POST
- **Middleware**: `authMiddleware`, `acquireTokenSilent`
- **Controller Method**: `authController.authorize`

### `/users/invite`:

- **Description**: Invites a specific user to the directory by sending a main and adds the user to specified group.
- **HTTP Method**: POST
- **Middleware**: `authMiddleware`, `acquireTokenSilent`
- **Controller Method**: `authController.invite`

## Utils:

1. **errorHandler.js** : Handles errors and logs them and sends error messages.
2. **fetch.js** : Takes in the endpoint and accesstoken and makes axios request to the endpoint with the access token in the Auth header. Returns the response from the endpoint.
3. **getMetaData.js** : Includes 2 methods, getCloudDiscoveryMetadata() and getAuthorityMetadata(), to retrieve metadata information from microsoft endpoint and returns the response. This is used to improve the performance as the metadata discovery by msal can be avoided.
4. **redisCache.js** : Configures the redis.

## Conclusion

This guide provides an overview of implementing the Authorization Code Flow using MSAL-Node, along with descriptions of key functions, middlewares,utils and routes. By following these steps, you can ensure secure authentication and authorization in your Node.js applications.
