# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

# MySQL Backend Setup

## Database Configuration

1. Create a new MySQL database:
```sql
CREATE DATABASE absence_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

3. Edit the `.env` file and update the database connection details:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=absence_system
DB_USERNAME=your_mysql_username
DB_PASSWORD=your_mysql_password
```

4. Generate an application key:
```bash
php artisan key:generate
```

5. Run migrations to create the database tables:
```bash
php artisan migrate
```

## API Endpoints

The backend exposes the following API endpoints:

### Groups
- `GET /api/groups` - Get all groups
- `GET /api/groups/{id}` - Get specific group
- `POST /api/groups` - Create a new group
- `PUT /api/groups/{id}` - Update a group
- `DELETE /api/groups/{id}` - Delete a group
- `GET /api/groups/{id}/trainees` - Get all trainees in a group

### Trainees
- `GET /api/trainees` - Get all trainees
- `GET /api/trainees/{id}` - Get specific trainee
- `POST /api/trainees` - Create a new trainee
- `PUT /api/trainees/{id}` - Update a trainee
- `DELETE /api/trainees/{id}` - Delete a trainee
- `GET /api/trainees/{id}/absences` - Get all absences for a trainee
- `GET /api/trainees/{id}/statistics` - Get statistics for a trainee
- `POST /api/trainees/bulk-import` - Bulk import trainees

### Absences
- `GET /api/absences` - Get all absence records
- `GET /api/absences/{id}` - Get specific absence record
- `POST /api/absences` - Create a new absence record
- `PUT /api/absences/{id}` - Update an absence record
- `DELETE /api/absences/{id}` - Delete an absence record
- `GET /api/groups/{id}/absences` - Get absences for a specific group
- `POST /api/absences/validate` - Validate absences
- `POST /api/absences/justify` - Justify absences
- `PATCH /api/absences/{id}/billet-entree` - Mark trainee as having a billet d'entrée
- `GET /api/groups/{id}/weekly-report` - Get weekly report for a group
