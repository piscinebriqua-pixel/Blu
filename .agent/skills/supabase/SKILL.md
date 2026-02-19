---
name: Supabase Guidelines
description: Best practices for using the Supabase client, error handling, and type safety.
---

# Supabase Usage Guidelines

## Client Initialization
The Supabase client is initialized in `src/lib/supabase.ts`. Always import it from there:
```typescript
import { supabase } from '../lib/supabase';
```

## Data Fetching Pattern
Always handle `data` and `error` properties. Use `try/catch` for async operations and provide user feedback on error.

```typescript
const fetchData = async () => {
    try {
        setLoading(true);
        const { data, error } = await supabase
            .from('table_name')
            .select('*');

        if (error) throw error;
        setData(data || []);
    } catch (error: any) {
        console.error('Error:', error.message);
        // Display toast error if available
    } finally {
        setLoading(false);
    }
};
```

## Row Level Security (RLS)
Be aware that RLS policies might restrict access. If a query returns empty data without error, check RLS policies in the Supabase dashboard or SQL scripts.

## Types
Ideally, generate TypeScript types from the database schema. If not available, creating interfaces for table rows (like `Technician` in `Technicians.tsx`) is good practice.

## Realtime Subscriptions
If realtime updates are needed, use `.on()` listeners and remember to clean them up in `useEffect` return function.
