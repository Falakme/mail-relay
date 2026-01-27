# Falak Mail Relay - Convex Backend

This directory contains the Convex backend functions for the Mail Relay application.

## Database Schema

Two main tables are defined in `schema.ts`:

### emailLogs Table
Stores all email sending events with full metadata:
- `messageId`: Unique message identifier (UUID)
- `to`: Recipient email address
- `subject`: Email subject
- `status`: 'success' | 'failed' | 'pending'
- `provider`: 'brevo' | 'notificationapi'
- `timestamp`: ISO 8601 format timestamp
- `error`: Optional error message
- `metadata`: Request metadata (senderName, replyTo, contentInfo, apiKeyId)

**Indexes:**
- `by_timestamp`: For efficient log queries and filtering by date range
- `by_status`: For filtering logs by delivery status

### apiKeys Table
Stores API keys for authentication with hashed security:
- `name`: User-defined key name
- `key`: SHA-256 hashed API key (never plaintext)
- `isActive`: Boolean to enable/disable the key
- `createdAt`: ISO 8601 format timestamp
- `lastUsed`: Optional last usage timestamp
- `usageCount`: Number of successful requests made with this key

**Indexes:**
- `by_key`: For fast API key lookup during authentication
- `by_active`: For filtering active keys only

## Functions

### emailLogs.ts

#### `getEmailLogs(limit, offset)`
Query function to retrieve paginated email logs in descending order by timestamp.

```typescript
const logs = await convex.query(api.emailLogs.getEmailLogs, { 
  limit: 50, 
  offset: 0 
});
```

#### `getEmailLogCount()`
Query function to get total count of all email logs.

#### `createEmailLog(messageId, to, subject, status, provider, metadata?, error?)`
Mutation function to log a sent email with all metadata captured at send time.

#### `deleteEmailLog(id)`
Mutation function to delete a specific email log record.

### apiKeys.ts

#### `getApiKeys()`
Query function to retrieve all API keys (with hashed keys, not plaintext).

```typescript
const keys = await convex.query(api.apiKeys.getApiKeys);
// Returns: Array with _id, _creationTime, name, key (hash), isActive, createdAt, usageCount, lastUsed
```

#### `getApiKeyByKey(key)`
Query function to validate an API key during authentication.

```typescript
const apiKey = await convex.query(api.apiKeys.getApiKeyByKey, { 
  key: 'fmr_xxxxx...' 
});
// Hashes the key internally before comparison
```

#### `createApiKey(name, key)`
Mutation function to create a new API key.

```typescript
const id = await convex.mutation(api.apiKeys.createApiKey, {
  name: 'My API Key',
  key: 'fmr_xxxxx...'  // Gets hashed before storage
});
```

#### `deleteApiKey(id)`
Mutation function to permanently delete an API key.

#### `toggleApiKeyStatus(id)`
Mutation function to enable/disable an API key without deleting it.

#### `updateApiKey(id, name?)`
Mutation function to rename an API key.

#### `incrementUsageCount(key)`
Mutation function to track API key usage on each successful email send.

## Security

- **API Keys are hashed with SHA-256** before storage using Node.js crypto module
- **No plaintext keys are ever stored** in the database
- **getApiKeyByKey()** automatically hashes the incoming key before comparing
- **Email logs never contain API key values**, only the hashed reference

## Data Retention

For a 100MB Convex database:
- ~150,000 - 250,000 email log records
- At 100 emails/day = 2-3 years of retention
- At 10,000 emails/day = ~2 weeks of retention

Recommendations:
- Implement archive policies for logs older than 6-12 months
- Monitor database size regularly
- Use pagination when querying large datasets

export const myMutationFunction = mutation({
  // Validators for arguments.
  args: {
    first: v.string(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Insert or modify documents in the database here.
    // Mutations can also read from the database like queries.
    // See https://docs.convex.dev/database/writing-data.
    const message = { body: args.first, author: args.second };
    const id = await ctx.db.insert("messages", message);

    // Optionally, return a value from your mutation.
    return await ctx.db.get("messages", id);
  },
});
```

Using this mutation function in a React component looks like:

```ts
const mutation = useMutation(api.myFunctions.myMutationFunction);
function handleButtonPress() {
  // fire and forget, the most common way to use mutations
  mutation({ first: "Hello!", second: "me" });
  // OR
  // use the result once the mutation has completed
  mutation({ first: "Hello!", second: "me" }).then((result) =>
    console.log(result),
  );
}
```

Use the Convex CLI to push your functions to a deployment. See everything
the Convex CLI can do by running `npx convex -h` in your project root
directory. To learn more, launch the docs with `npx convex docs`.
