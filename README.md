# CLI Env Toggler

## Screenshot

![Example_Gif](https://user-images.githubusercontent.com/64075030/215582943-eb302484-42fb-4574-84c8-70674d54bedb.gif)

## Usage

Ensure you have Node installed, then run

```
npx cli-env-toggler [GROUP]
```

or for more detailed options, run

```
npx cli-env-toggler -h
```

## Example(s)

### 1. Database Config
You currently have a `.env` file with database parameters in, but sometimes switch to another database, and so have commented out the set for the alternate database.

```env
# DB_HOST=host.docker.internal
# DB_PORT=33061
# DB_USERNAME=root
# DB_PASSWORD=

DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
```

When you want to switch, you have to select each of these parameters and enable/disable them, which is a bit of a manual process.

CLI Env Toggler enables you to run a command to instantly uncomment the values that are commented out, and comment out the existing values.

#### Step 1 - Rewrite .env variables with the following:
```env
###-DB DB_HOST=host.docker.internal
###-DB DB_PORT=33061
###-DB DB_USERNAME=root
###-DB DB_PASSWORD=

DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
```

#### Step 2 - Run the toggle for the group 'DB'
```bash
npx cli-env-toggler DB
```

And that's it! Your environment variables will now look like the following:
```env
DB_HOST=host.docker.internal
DB_PORT=33061
DB_USERNAME=root
DB_PASSWORD=

###-DB DB_HOST=mysql
###-DB DB_PORT=3306
###-DB DB_USERNAME=root
###-DB DB_PASSWORD=password
```

## Dev

```
npm run build && npm i -g
```

Then can do
```
npx cli-env-toggler
```
